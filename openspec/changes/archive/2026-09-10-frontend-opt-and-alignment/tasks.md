## 1. Vite 生产构建与细粒度分包优化 (Vite Chunk Splitting)

- [x] 1.1 在 `frontend/apps/admin/vite.config.ts` 中配置 `rollupOptions.output.manualChunks`（划分 `vendor-react`, `vendor-antd-core`, `vendor-antd`, `vendor-pro`, `vendor-libs`），运行 `pnpm --filter admin build` 验证消除 1.4MB 超大 Chunk 且无 ProForm 循环引用警告
- [x] 1.2 在 `frontend/apps/portal/vite.config.ts` 中同步配置完全对齐的 `manualChunks` 与构建限制，运行 `pnpm --filter portal build` 验证生产打包成功且两端分包架构一致

## 2. 网络请求层弹性与 AbortController 防竞态 (Network Resilience)

- [x] 2.1 在 `frontend/packages/api/src/gocliRequest.ts` 中将 `signal?: AbortSignal` 融入 `RequestOptions` 与 `fetch` 调用，并在异常处理中识别并静默抑制 `AbortError`，编写测试文件验证请求中断行为
- [x] 2.2 封装基于 React 生命周期的请求取消辅助机制，在路由导航离开或 ProTable 快速分页时自动 abort 上一次未完成的异步请求

## 3. 多标签页会话与全局偏好同步 (Multi-Tab Session Sync)

- [x] 3.1 在 `frontend/packages/shared/src/sessionSync.ts` 中封装基于 `storage` 事件的跨 Tab 广播机制（支持退出登录、主题切换、多语言切换同步），并编写单元测试验证事件分发
- [x] 3.2 在 `apps/admin` 与 `apps/portal` 的全局入口挂载多 Tab 协同监听器，验证一处登出或切换偏好时同源所有活跃 Tab 即时联动

## 4. ProComponents 现代弹窗表单范式 (ModalForm & DrawerForm)

- [x] 4.1 在 `frontend/apps/admin/src/pages/System/Users/` 中采用 `ModalForm` 重构用户新增与编辑弹窗，消除散落的状态样板代码并保留表单校验
- [x] 4.2 在 `frontend/apps/admin/src/pages/System/Roles/` 中采用 `ModalForm` 重构角色新增与编辑弹窗，验证交互一致性

## 5. 全量双端回归与质量守卫 (Quality & Verification)

- [x] 5.1 运行 `just test-frontend` 确保双端全部单元测试 100% 通过
- [x] 5.2 运行 `just lint-antd` 确保双端符合 Ant Design 6 规范（0 废弃项、0 警告）
- [x] 5.3 运行 `just build-frontend` 验证双端生产打包成功且所有 Chunk 均在合理范围
