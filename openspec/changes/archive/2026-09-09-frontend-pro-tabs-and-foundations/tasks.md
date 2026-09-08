## 1. 基础质感与工程规范 (Foundations & Exceptions)

- [x] 1.1 创建 `apps/admin/src/pages/Exception/404.tsx` 与 `500.tsx`，并在 `config/routes.ts` 中注册 `/500` 及将通配路由 `*` 指向 404 页面
- [x] 1.2 创建 `apps/admin/src/global.css`（6px 优雅圆角细滚动条、选中文本高亮、深浅色模式自适应），并在 `src/main.tsx` 中引入
- [x] 1.3 创建 `apps/admin/src/constants/index.ts`，收敛应用层 Storage Keys、默认分页选项、Tab 默认项等核心常量

## 2. 可配置多标签页导航系统 (Multi-Tabs Layout)

- [x] 2.1 在 `apps/admin/src/config/defaultSettings.ts` 中增加 `tabsLayout: boolean` 配置（默认为 `true`）
- [x] 2.2 创建 `apps/admin/src/components/MultiTabs/index.tsx`，实现路由监听、Tab 标签追加、切换、关闭（当前/其他/全部）及右侧快捷操作菜单
- [x] 2.3 在 `apps/admin/src/layouts/BasicLayout.tsx` 中挂载 `MultiTabs`，并在 `src/components/index.ts` 中统一导出

## 3. 构建与规范验证 (Validation)

- [x] 3.1 运行 `pnpm -r exec tsc --noEmit` 与 `just build-frontend` 验证类型安全与打包产物完整性
- [x] 3.2 运行 `just lint-antd` 确保 Ant Design 6.x 规范 0 警告 0 弃用项
