## 1. 代理配置中心抽取 (Proxy Config Modules)

- [x] 1.1 在 `frontend/apps/admin/src/config/proxy.ts` 创建多环境代理配置中心，导出 `dev`、`test`、`pre` 环境配置及 `PROXY_TARGET` 动态解析工具函数
- [x] 1.2 在 `frontend/apps/portal/src/config/proxy.ts` 创建多环境代理配置中心，对齐门户端多环境代理规则

## 2. 环境变量与模式文件建立 (.env files)

- [x] 2.1 为 `apps/admin` 添加 `.env.development`、`.env.test` 和 `.env.pre` 配置文件并验证环境变量注入
- [x] 2.2 为 `apps/portal` 添加 `.env.development`、`.env.test` 和 `.env.pre` 配置文件并验证环境变量注入

## 3. Vite 配置与代理生命周期日志改造 (Vite Config & Logging)

- [x] 3.1 改造 `frontend/apps/admin/vite.config.ts` 使用 `defineConfig(({ mode }) => ...)` 结合 `loadEnv` 动态加载代理配置并挂载 `proxyReq` 与 `error` 终端诊断日志
- [x] 3.2 改造 `frontend/apps/portal/vite.config.ts` 动态加载代理配置并挂载诊断日志

## 4. 脚本集成与全栈验证 (Scripts & Verification)

- [x] 4.1 在 `apps/admin/package.json` 与 `apps/portal/package.json` 中配置 `dev:test` 与 `dev:pre` 脚本命令，并在根目录 `justfile` 补充便捷指令
- [x] 4.2 执行 `pnpm -r exec tsc --noEmit` 与 `just build-frontend` 确保生产打包与类型校验 100% 通过
- [x] 4.3 运行 `just lint-antd` 确保全栈代码规范 0 警告 0 弃用项
