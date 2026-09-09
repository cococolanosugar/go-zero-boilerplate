## 1. 容灾防护：页面级 ErrorBoundary 错误边界

- [x] 1.1 在 `apps/admin/src/components/ErrorBoundary.tsx` 与 `apps/portal/src/components/ErrorBoundary.tsx` 创建原生 React 错误边界，并编写单元测试验证异常捕获与重置
- [x] 1.2 在 `apps/admin/src/router/RouteRenderer.tsx` 与 `apps/portal/src/router/RouteRenderer.tsx` 中包裹 `ErrorBoundary`，验证页面崩溃时不波及全局导航

## 2. 交互中枢：企业级 NoticeIcon 消息与待办中心

- [x] 2.1 在 `apps/admin/src/components/RightContent/NoticeIcon/` 创建消息中心组件（支持“通知/消息/待办”三 Tab、未读 Badge 与一键清空）
- [x] 2.2 在 `apps/admin/src/components/RightContent/RightContentActions.tsx` 挂载 `NoticeIcon`，验证 Popover 交互与已读标记

## 3. 视觉定制：SettingDrawer 多色板 Token 联动

- [x] 3.1 扩展 `LayoutSettingsContext.tsx`，支持 `primaryColor` 与预设 8 色板（拂晓蓝、极客绿、酱紫、薄暮红、火山橙等）并支持 LocalStorage 持久化
- [x] 3.2 在 `Root.tsx` `<ConfigProvider>` 中注入动态 `theme.token.colorPrimary`，验证多色板即时热切换

## 4. 依赖与研发效能：集成 ahooks useRequest

- [x] 4.1 在 `frontend` 工作区安装 `ahooks`，并验证全端构建与 TypeScript 类型推导
- [x] 4.2 编写 `useRequest` 业务测试用例，验证异步加载态、防抖与取消机制

## 5. 全面质量验证与规范测试

- [x] 5.1 运行 `just test-frontend`，确保单元测试集 100% 通过
- [x] 5.2 运行 `just lint-antd` 与 `just build-frontend`，确保 0 废弃项且双端生产编译成功
