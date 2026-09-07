## 1. 运行时状态管理与上下文封装

- [x] 1.1 在 `frontend/apps/admin/src/contexts/InitialStateContext.tsx` 中封装 `InitialStateProvider` 与 `useInitialState()` Hook，管理 `currentUser`、`permissions`、`roles` 与 `menus` 全局初始化与刷新
- [x] 1.2 在 `frontend/apps/portal/src/contexts/InitialStateContext.tsx` 中封装 `InitialStateProvider` 与 `useInitialState()` Hook，支持门户用户画像与登录态响应式刷新

## 2. Admin 管理后台运行时配置解耦与布局重构

- [x] 2.1 将 `frontend/apps/admin/src/App.tsx` 重命名重构为 `src/Root.tsx`，避免 Windows 文件系统与 `app.tsx` 大小写冲突，并接入 `InitialStateProvider`
- [x] 2.2 创建标准 Ant Design Pro 运行时配置文件 `frontend/apps/admin/src/app.tsx`，导出 `getInitialState()` 异步初始化函数与 `layout()` 运行时配置函数（承载用户头像下拉、暗黑模式切换、多语言选择、全屏、水印、外部文档链接及设置抽屉等全部业务插槽）
- [x] 2.3 重构 `frontend/apps/admin/src/layouts/BasicLayout.tsx`，全面移除内部 200+ 行业务插槽代码，直接基于 `app.tsx` 导出的 `layout()` 运行时配置进行纯粹渲染
- [x] 2.4 更新 `frontend/apps/admin/src/main.tsx` 引入 `Root.tsx`

## 3. Portal 门户系统运行时配置解耦与布局重构

- [x] 3.1 将 `frontend/apps/portal/src/App.tsx` 重命名重构为 `src/Root.tsx`，接入 `InitialStateProvider`，并更新 `src/main.tsx`
- [x] 3.2 创建标准运行时配置文件 `frontend/apps/portal/src/app.tsx`，导出 `getInitialState()` 与 `layout()` 运行时配置函数（承载登录弹窗、个人画像抽屉、暗黑主题切换、多语言选择与门户页脚等业务插槽）
- [x] 3.3 重构 `frontend/apps/portal/src/layouts/PortalLayout.tsx`，彻底移除组件内硬编码的交互配置，改由 `app.tsx` 的 `layout()` 驱动纯布局渲染

## 4. 全栈构建验证与 Ant Design 规范检查

- [x] 4.1 执行 `pnpm --filter @zero/admin build` 与 `pnpm --filter @zero/portal build` 验证 TypeScript 编译与 Vite 打包通过，各分包产物正常
- [x] 4.2 执行 `just lint-antd` 确保所有运行时插槽组件与配置遵循 Ant Design 6.x 规范，0 错误 0 弃用项
