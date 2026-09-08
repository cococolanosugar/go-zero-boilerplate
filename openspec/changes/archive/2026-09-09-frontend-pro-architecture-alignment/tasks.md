## 1. 基础工程资产与工具健全 (P0)

- [x] 1.1 创建 `apps/admin/public/` 目录，放置 `favicon.svg`、`logo.svg` 与 `robots.txt`，并在 `index.html` 中引用本地图标
- [x] 1.2 创建 `apps/admin/src/utils/download.ts`（Blob/URL 触发安全下载）、`apps/admin/src/utils/storage.ts`（带命名空间与 TTL 缓存）与 `src/utils/index.ts`
- [x] 1.3 创建 `apps/admin/src/typings.d.ts`，补充环境变量、非代码静态资产（SVG/PNG）及全局对象类型声明

## 2. Ant Design Pro 企业级交互组件落地 (P1)

- [x] 2.1 创建 `apps/admin/src/components/Footer/index.tsx`（基于 `DefaultFooter` 配置版权、备案号与外链），并在 `src/app.tsx` 中配置 `footerRender`
- [x] 2.2 创建 `apps/admin/src/components/HeaderSearch/index.tsx`，支持 `Cmd+K` / `Ctrl+K` 快捷键聚焦、模糊搜索已授权菜单树与回车即达跳转
- [x] 2.3 在 `apps/admin/src/components/RightContent/RightContentActions.tsx` 中挂载 `HeaderSearch`，并将 `app.tsx` 中的 Logo 指向本地 `/logo.svg`

## 3. 规范与构建验证 (Validation)

- [x] 3.1 执行 `pnpm -r exec tsc --noEmit` 与 `just build-frontend` 验证类型安全与打包产物完整性
- [x] 3.2 执行 `just lint-antd` 确保 Ant Design 6.x 规范 0 警告 0 弃用项
