## 1. 核心 Mock 引擎插件开发 (Vite Mock Plugin)

- [x] 1.1 创建通用 Vite 开发中间件插件（支持 Ant Design Pro `"METHOD /path"` 路由匹配、动态路径参数 `:param` 提取、JSON Body 解析、延迟仿真及彩色终端诊断输出）
- [x] 1.2 在 `frontend/apps/admin/vite.config.ts` 与 `frontend/apps/portal/vite.config.ts` 中根据 `VITE_USE_MOCK` 环境变量条件式挂载该插件

## 2. Ant Design Pro 风格 Mock 数据集实现 (Mock Modules)

- [x] 2.1 创建 `frontend/apps/admin/mock/auth.mock.ts`，实现登录校验、个人资料拉取与 Token 签发模拟
- [x] 2.2 创建 `frontend/apps/admin/mock/dashboard.mock.ts`，实现监控大盘指标卡、7 天趋势图与微服务并发聚合数据模拟
- [x] 2.3 创建 `frontend/apps/admin/mock/system.mock.ts`，实现员工列表、RBAC 角色权限、动态菜单树、数据字典与审计日志 Mock
- [x] 2.4 创建 `frontend/apps/admin/mock/orders.mock.ts`，实现订单 ProTable 分页查询与微服务聚合详情 Mock
- [x] 2.5 创建 `frontend/apps/admin/mock/index.ts` 聚合导出所有 Mock 规则，并在 `frontend/apps/portal/mock/index.ts` 建立门户端基础 Mock 数据集

## 3. 运行环境模式与脚本集成 (Environment & Scripts)

- [x] 3.1 创建 `frontend/apps/admin/.env.mock` 与 `frontend/apps/portal/.env.mock` 环境变量文件，并确保 `.gitignore` 规则放行跟踪
- [x] 3.2 在各应用 `package.json`、根目录 `package.json` 及 `justfile` 补充 `dev:mock`、`run-admin-mock` 与 `run-portal-mock` 便捷启动指令

## 4. 构建与规范验证 (Validation)

- [x] 4.1 执行 `pnpm -r exec tsc --noEmit` 与 `just build-frontend` 验证 Mock 代码类型安全且生产打包零侵入
- [x] 4.2 执行 `just lint-antd` 确保全栈组件规范 0 警告 0 弃用项
