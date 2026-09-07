## 1. 底层网络引擎拦截器与错误抽象 (@zero/api)

- [x] 1.1 在 `frontend/packages/api/src/gocliRequest.ts` 中增加拦截器链支持（`addRequestInterceptor` / `addResponseInterceptor`）、全局错误处理器注入（`setErrorHandler`）与 `skipErrorHandler` 控制
- [x] 1.2 在 `frontend/packages/api/src/adapter.ts` 中实现通用的 `toProTableRequest` 适配器函数，完成 ProTable 分页查询与返回结果自动映射
- [x] 1.3 在 `frontend/packages/api/src/index.ts` 中导出适配器、错误类型与核心拦截器定义

## 2. 业务接口按领域切分组织 (@zero/api/services)

- [x] 2.1 创建 `frontend/packages/api/src/services/auth.ts`，聚合登录、退出、Token 刷新与个人画像接口
- [x] 2.2 创建 `frontend/packages/api/src/services/user.ts` 与 `frontend/packages/api/src/services/order.ts`，聚合会员与订单领域接口
- [x] 2.3 创建 `frontend/packages/api/src/services/system/` 目录，分别建立 `users.ts`、`roles.ts`、`menus.ts`、`apis.ts`、`dicts.ts`、`logs.ts` 细分领域服务
- [x] 2.4 在 `frontend/packages/api/src/services/index.ts` 中汇总导出各领域服务命名空间，保持与根包全兼容

## 3. 应用级统一错误治理与运行时集成 (admin & portal)

- [x] 3.1 在 `frontend/apps/admin/src/requestErrorConfig.ts` 中建立错误分流适配器（联动 Ant Design 6.x `App.useApp()` 的 `message` 与 `notification`），并在 `admin/src/app.tsx` 运行时中注册
- [x] 3.2 在 `frontend/apps/portal/src/requestErrorConfig.ts` 中建立门户端错误分流适配器，并在 `portal/src/app.tsx` 中注册
- [x] 3.3 在 `frontend/apps/admin/src/services/` 中建立应用级 Service 门面与类型导出

## 4. 业务页面重构与构建规范验证

- [x] 4.1 重构 `frontend/apps/admin/src/pages/System/Users/index.tsx`，使用领域服务与 `toProTableRequest`，彻底移除表单与删除操作中的冗余 `try...catch` 错误提示
- [x] 4.2 重构 `frontend/apps/admin/src/pages/System/Roles/index.tsx` 与 `Orders/index.tsx`，推广应用相同的 ProTable 适配器与去样板化调用
- [x] 4.3 运行 `pnpm --filter @zero/admin build` 与 `pnpm --filter @zero/portal build` 验证 TypeScript 静态类型与 Vite 打包通过
- [x] 4.4 运行 `just lint-antd` 确保所有修改与组件遵循 Ant Design 6.x 规范，0 错误 0 弃用项
