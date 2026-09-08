import type { Plugin, Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

export type MockHandler =
  | ((req: any, res: any) => void | Promise<void>)
  | Record<string, any>
  | any[];

export interface MockOptions {
  mockData?: Record<string, MockHandler>;
  delay?: number;
  enabled?: boolean;
}

export function vitePluginMock(options: MockOptions = {}): Plugin {
  const { mockData = {}, delay = 150, enabled = true } = options;

  if (!enabled) {
    return { name: "vite-plugin-mock-dev" };
  }

  return {
    name: "vite-plugin-mock-dev",
    configureServer(server) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (!req.url || !req.method) {
            return next();
          }

          const [urlPath, queryString] = req.url.split("?");
          const method = req.method.toUpperCase();

          let matchedKey = `${method} ${urlPath}`;
          let handler = mockData[matchedKey];
          const params: Record<string, string> = {};

          if (!handler) {
            const urlSegments = urlPath.split("/").filter(Boolean);
            const found = Object.keys(mockData).find((key) => {
              const [kMethod, kPath] = key.split(" ");
              if (kMethod.toUpperCase() !== method) return false;
              if (kPath === urlPath) return true;
              const kSegments = kPath.split("/").filter(Boolean);
              if (kSegments.length !== urlSegments.length) return false;
              const isMatch = kSegments.every((seg, idx) => {
                return seg.startsWith(":") || seg === urlSegments[idx];
              });
              if (isMatch) {
                kSegments.forEach((seg, idx) => {
                  if (seg.startsWith(":")) {
                    params[seg.slice(1)] = urlSegments[idx];
                  }
                });
                return true;
              }
              return false;
            });
            if (found) {
              matchedKey = found;
              handler = mockData[found];
            }
          }

          // 未在 mock/ 中匹配到的请求，自动穿透给 Vite Proxy 转发真实微服务网关
          if (!handler) {
            return next();
          }

          // 提取 Query 参数
          const query: Record<string, string> = {};
          if (queryString) {
            const searchParams = new URLSearchParams(queryString);
            searchParams.forEach((val, key) => {
              query[key] = val;
            });
          }

          // 异步提取请求 Body (POST/PUT/PATCH/DELETE)
          let body: any = {};
          if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
            body = await new Promise((resolve) => {
              let data = "";
              req.on("data", (chunk) => {
                data += chunk;
              });
              req.on("end", () => {
                try {
                  resolve(data ? JSON.parse(data) : {});
                } catch {
                  resolve(data);
                }
              });
            });
          }

          const mockReq = {
            url: req.url,
            path: urlPath,
            method,
            query,
            params,
            body,
            headers: req.headers,
          };

          const mockRes = {
            setHeader: (name: string, value: string) => res.setHeader(name, value),
            status: (statusCode: number) => {
              res.statusCode = statusCode;
              return mockRes;
            },
            json: (data: any) => {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              if (delay > 0) {
                setTimeout(() => res.end(JSON.stringify(data)), delay);
              } else {
                res.end(JSON.stringify(data));
              }
            },
            send: (data: any) => {
              if (typeof data === "object") {
                mockRes.json(data);
              } else {
                res.setHeader("Content-Type", "text/plain; charset=utf-8");
                if (delay > 0) {
                  setTimeout(() => res.end(String(data)), delay);
                } else {
                  res.end(String(data));
                }
              }
            },
          };

          console.log(
            `\x1b[35m[Mock 响应]\x1b[0m ${method} ${urlPath} \x1b[33m(仿真延迟 ${delay}ms)\x1b[0m`
          );

          try {
            if (typeof handler === "function") {
              await handler(mockReq, mockRes);
            } else {
              mockRes.json(handler);
            }
          } catch (err: any) {
            console.error(`\x1b[31m[Mock 执行异常]\x1b[0m ${method} ${urlPath}:`, err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ code: 500, msg: `Mock handler error: ${err.message}` }));
          }
        }
      );
    },
  };
}

export default vitePluginMock;
