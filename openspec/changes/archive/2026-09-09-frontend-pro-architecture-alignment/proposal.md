## Why

虽然本项目前端已在 Monorepo 架构、契约生成（`@zero/api`）、动态权限、多环境代理与离线 Mock 方面实现了坚实基础，但在与官方 Ant Design Pro 标准对齐时，仍缺少应用级工具库 (`src/utils/`)、全局类型声明 (`src/typings.d.ts`)、静态资产容器 (`public/`)、全局页脚 (`DefaultFooter`) 及顶部全局快捷命令搜索面板 (`HeaderSearch`)。补齐这些基础架构与企业级业务组件，将全面提升前端开发的规范性、人机交互效率与资产闭环度。

## What Changes

- **P0 基础工程资产与工具规范补齐**：
  - 新增 `frontend/apps/admin/public/` 静态资源目录，内嵌 `favicon.svg`、`logo.svg` 与 `robots.txt`，去除对外部 CDN 链接的强依赖。
  - 新增 `frontend/apps/admin/src/utils/` 目录：
    - `download.ts`：处理后台返回的 Blob/ArrayBuffer 二进制流或 URL 下载，自动解析 Content-Disposition 文件名并触发安全下载。
    - `storage.ts`：封装带有命名空间隔离与过期时间 (TTL) 机制的持久化工具类。
  - 新增 `frontend/apps/admin/src/typings.d.ts`：提供环境变量、静态媒体资源（SVG/PNG）及全局挂载对象的强类型声明。
- **P1 Ant Design Pro 企业级全局交互组件落地**：
  - 新增 `frontend/apps/admin/src/components/Footer/`：基于 `@ant-design/pro-components` 的 `DefaultFooter`，包含 GitHub 仓库直达、版权信息与企业级链接，并在 `src/app.tsx` 中配置 `footerRender`。
  - 新增 `frontend/apps/admin/src/components/HeaderSearch/`：实现顶部快捷搜索组件，支持 `Cmd+K` / `Ctrl+K` 键盘全局激活、模糊匹配路由菜单与回车即达跳转，集成至 `RightContentActions`。

## Capabilities

### New Capabilities
- `frontend-pro-architecture-alignment`: 涵盖应用级工具库 (`download`/`storage`)、全局类型、本地公共静态资源、企业级标准页脚 `DefaultFooter` 以及顶部全局命令搜索 `HeaderSearch`。

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **受影响代码**：
  - `frontend/apps/admin/src/app.tsx`（挂载 `footerRender` 与本地静态 Logo）
  - `frontend/apps/admin/src/components/RightContent/RightContentActions.tsx`（挂载 `HeaderSearch`）
  - `frontend/apps/admin/index.html`（链接至本地 `public/favicon.svg`）
- **依赖与构建**：
  - 零新增外部第三方 npm 依赖，完全基于现有的 React 18、Ant Design 6.x 与 ProComponents。
