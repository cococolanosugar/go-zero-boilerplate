import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { getProxyConfig } from "./src/config/proxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appEnv = env.APP_ENV || (mode === "mock" ? "dev" : mode) || "dev";
  const customTarget = env.PROXY_TARGET || process.env.PROXY_TARGET;

  const rawProxy = getProxyConfig(appEnv, customTarget);

  const proxyWithLogger: Record<string, any> = {};
  for (const [route, opts] of Object.entries(rawProxy)) {
    proxyWithLogger[route] = {
      ...opts,
      configure: (proxy: any, options: any) => {
        proxy.on("proxyReq", (proxyReq: any, req: any) => {
          const targetUrl = options.target || opts.target;
          console.log(
            `\x1b[36m[Titan Proxy 转发]\x1b[0m ${req.method} ${req.url} -> \x1b[32m${targetUrl}${proxyReq.path}\x1b[0m`
          );
        });
        proxy.on("error", (err: any, req: any) => {
          console.error(`\x1b[31m[Titan Proxy 失败]\x1b[0m ${req.method} ${req.url}:`, err.message);
        });
      },
    };
  }

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 3002,
      proxy: proxyWithLogger,
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("@ant-design/charts") || id.includes("@antv")) {
                return "vendor-charts";
              }
              if (
                id.includes("antd") ||
                id.includes("@ant-design/") ||
                id.includes("rc-")
              ) {
                return "vendor-ui";
              }
              return "vendor-core";
            }
          },
        },
      },
    },
  };
});
