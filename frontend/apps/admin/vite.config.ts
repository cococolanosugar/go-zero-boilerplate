import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { getProxyConfig } from "./src/config/proxy";
import { vitePluginMock, mockData } from "./mock";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appEnv = env.APP_ENV || (mode === "mock" ? "dev" : mode) || "dev";
  const customTarget = env.PROXY_TARGET || process.env.PROXY_TARGET;
  const useMock = env.VITE_USE_MOCK === "true" || mode === "mock";

  const rawProxy = getProxyConfig(appEnv, customTarget);

  // 为所有代理条目挂载生命周期诊断日志
  const proxyWithLogger: Record<string, any> = {};
  for (const [route, opts] of Object.entries(rawProxy)) {
    proxyWithLogger[route] = {
      ...opts,
      configure: (proxy: any, options: any) => {
        proxy.on("proxyReq", (proxyReq: any, req: any) => {
          const targetUrl = options.target || opts.target;
          console.log(
            `\x1b[36m[Proxy 转发]\x1b[0m ${req.method} ${req.url} -> \x1b[32m${targetUrl}${proxyReq.path}\x1b[0m`
          );
        });
        proxy.on("error", (err: any, req: any) => {
          console.error(`\x1b[31m[Proxy 失败]\x1b[0m ${req.method} ${req.url}:`, err.message);
        });
      },
    };
  }

  return {
    plugins: [
      react(),
      vitePluginMock({
        mockData,
        enabled: useMock,
        delay: 150,
      }),
    ],
    server: {
      port: 3001,
      proxy: proxyWithLogger,
    },
  };
});
