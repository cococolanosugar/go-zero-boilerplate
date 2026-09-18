import type { ProxyOptions } from "vite";

export type EnvType = "dev" | "test" | "pre";

export const proxyConfig: Record<EnvType, Record<string, ProxyOptions>> = {
  dev: {
    "/api": {
      target: "http://127.0.0.1:8888",
      changeOrigin: true,
      ws: true,
    },
  },
  test: {
    "/api": {
      target: "https://test-api.go-zero-boilerplate.dev",
      changeOrigin: true,
      secure: false,
      ws: true,
    },
  },
  pre: {
    "/api": {
      target: "https://pre-api.go-zero-boilerplate.dev",
      changeOrigin: true,
      secure: true,
      ws: true,
    },
  },
};

export function getProxyConfig(appEnv?: string, customTarget?: string): Record<string, ProxyOptions> {
  const envKey = (appEnv || "dev") as EnvType;
  const base = proxyConfig[envKey] || proxyConfig.dev;

  const resolved: Record<string, ProxyOptions> = {};
  for (const [prefix, options] of Object.entries(base)) {
    resolved[prefix] = { ...options };
  }

  if (customTarget && resolved["/api"]) {
    resolved["/api"].target = customTarget;
  }

  return resolved;
}

export default proxyConfig;
