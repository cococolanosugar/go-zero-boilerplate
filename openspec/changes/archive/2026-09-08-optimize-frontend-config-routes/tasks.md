## 1. 路由类型抽象与通用加载组件

- [x] 1.1 在 `frontend/apps/admin/src/config/routes.types.ts` 与 `frontend/apps/portal/src/config/routes.types.ts` 中定义通用的 `AppRouteItem` 路由项接口，并通过 TypeScript 编译检查
- [x] 1.2 在 `admin` 和 `portal` 中分别封装统一的 `PageLoading` 居中骨架组件，用于 React 异步分包加载时的 Suspense 占位

## 2. Admin 管理后台路由与声明式权限重构

- [x] 2.1 创建 `frontend/apps/admin/src/config/routes.ts`，以 `React.lazy()` 方式按需引入所有页面（监控大盘、订单、用户、系统管理各子模块），并声明其 icon、locale 及 access 权限码
- [x] 2.2 实现 `frontend/apps/admin/src/access.ts` 权限判定引擎，提供 `getAccess` 工厂函数，实现超管（userId=1 或 ROLE_ADMIN）自动豁免与按 `permissions` 字典精确比对
- [x] 2.3 创建 `frontend/apps/admin/src/pages/Exception/403.tsx`，提供带有“返回控制台”交互的标准 Ant Design 403 权限拒绝界面
- [x] 2.4 构建 `frontend/apps/admin/src/router/RouteRenderer.tsx` 通用路由转换器，递归解析声明式路由树，自动注入 `<Suspense>` 容器与 URL 级 403 权限阻断守卫
- [x] 2.5 重构 `frontend/apps/admin/src/router/index.tsx`，替换原先全量静态引入与硬编码 JSX `<Route>`，改由 `RouteRenderer` 统一驱动
- [x] 2.6 重构 `frontend/apps/admin/src/layouts/BasicLayout.tsx`，彻底移除组件内硬编码的 `getDefaultRouteConfig`，改为基于 `config/routes.ts` 结合国际化与后端下发动态菜单树合并渲染

## 3. Portal 门户系统声明式路由与布局重构

- [x] 3.1 创建 `frontend/apps/portal/src/config/routes.ts`，将首页、微服务治理、联调工作台等页面改造成 `React.lazy()` 动态按需加载并集中配置
- [x] 3.2 构建 `frontend/apps/portal/src/router/RouteRenderer.tsx`，解析门户前台的公开路由与主布局路由
- [x] 3.3 重构 `frontend/apps/portal/src/App.tsx`，移除硬编码的 JSX `<Route>` 分支，改由 `RouteRenderer` 渲染
- [x] 3.4 重构 `frontend/apps/portal/src/layouts/PortalLayout.tsx`，移除原先手写的 `routeConfig` 静态对象，直接复用声明式路由表并接入国际化多语言

## 4. 全栈构建验证与 Ant Design 规范检查

- [x] 4.1 执行 `pnpm --filter @zero/admin build` 与 `pnpm --filter @zero/portal build`，验证 TypeScript 类型无报错，且 dist 产物中各页面正确生成独立 chunk 文件（按需代码分割生效）
- [x] 4.2 执行 `just lint-antd`（或 `antd lint`），确保所有重构与新增的前端组件遵循 Ant Design 6.x 规范，0 废弃项、0 语法告警
