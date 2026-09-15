import type { ProxyOptions } from "vite";

export type EnvType = "dev" | "test" | "pre";

export const proxyConfig: Record<EnvType, Record<string, ProxyOptions>> = {
  // 1. 本地单机开发模式 (默认连接本地 Go 网关 HTTP 8888)
  dev: {
    "/api": {
      target: "http://127.0.0.1:8888",
      changeOrigin: true,
      ws: true,
    },
    "/openapi.json": {
      target: "http://127.0.0.1:8888",
      changeOrigin: true,
    },
  },
  // 2. 远程联调 / 测试环境 (无需拉起本地 Go 微服务)
  test: {
    "/api": {
      target: "https://test-api.go-zero-boilerplate.dev",
      changeOrigin: true,
      secure: false,
      ws: true,
    },
    "/openapi.json": {
      target: "https://test-api.go-zero-boilerplate.dev",
      changeOrigin: true,
      secure: false,
    },
  },
  // 3. 预发布验证环境
  pre: {
    "/api": {
      target: "https://pre-api.go-zero-boilerplate.dev",
      changeOrigin: true,
      secure: true,
      ws: true,
    },
    "/openapi.json": {
      target: "https://pre-api.go-zero-boilerplate.dev",
      changeOrigin: true,
      secure: true,
    },
  },
};

/**
 * 获取生效的代理配置
 * 优先级: 环境变量 PROXY_TARGET > APP_ENV 指定环境 (dev/test/pre) > 默认 dev
 */
export function getProxyConfig(appEnv?: string, customTarget?: string): Record<string, ProxyOptions> {
  const envKey = (appEnv || "dev") as EnvType;
  const base = proxyConfig[envKey] || proxyConfig.dev;

  const resolved: Record<string, ProxyOptions> = {};
  for (const [prefix, options] of Object.entries(base)) {
    resolved[prefix] = { ...options };
  }

  if (customTarget) {
    for (const options of Object.values(resolved)) {
      options.target = customTarget;
    }
  }

  return resolved;
}

export default proxyConfig;
