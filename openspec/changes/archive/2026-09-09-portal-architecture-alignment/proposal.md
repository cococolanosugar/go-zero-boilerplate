## Why

同属于 pnpm workspace 前端多端矩阵的 `frontend/apps/portal`（官方门户系统）此前未与 `frontend/apps/admin` 的工程与目录规范对齐。Portal 当前缺失独立的公共静态资产（`public/`）、自适应 6px 优雅滚动条（`global.css`）、全局类型声明（`typings.d.ts`）、应用级常量（`constants/`）、浏览器端工具库（`utils/`）、异常页矩阵（`404`/`500`）以及模块化全局页脚。对齐这些规范将使 Monorepo 多端应用保持高度一致的工业级工程水准。

## What Changes

- **1. 本地公共静态资产规范 (Public Assets)**：
  - 新增 `frontend/apps/portal/public/` 目录，放置专属于门户端的极客紫品牌矢量图标（`favicon.svg`、`logo.svg`）与 `robots.txt`。
  - 更新 `frontend/apps/portal/index.html` 接入本地 `/favicon.svg`。
  - 更新 `frontend/apps/portal/src/config/defaultSettings.ts` 中的 `logo` 指向本地 `/logo.svg`。
- **2. 全局样式与优雅细滚动条 (Global Styling)**：
  - 新增 `frontend/apps/portal/src/global.css`：实现 6px 优雅圆角细滚动条（自适应亮色与暗黑模式）、字体抗锯齿平滑渲染与文本选中高亮。
  - 在 `frontend/apps/portal/src/main.tsx` 中导入 `global.css`。
- **3. 类型声明与常量收敛 (Typings & Constants)**：
  - 新增 `frontend/apps/portal/src/typings.d.ts`：声明 `ImportMetaEnv`、`*.svg`、`*.png` 等静态资源。
  - 新增 `frontend/apps/portal/src/constants/index.ts`：统一收敛门户端的 Storage Keys 与通用常量。
- **4. 浏览器工具库 (Browser Utilities)**：
  - 新增 `frontend/apps/portal/src/utils/`：引入安全二进制流下载 (`download.ts`) 与带命名空间/TTL 的本地持久化工具 (`storage.ts`)。
- **5. 异常页面矩阵与路由兜底 (Exception Matrix)**：
  - 新增 `frontend/apps/portal/src/pages/Exception/404.tsx` 与 `500.tsx`。
  - 更新 `frontend/apps/portal/src/config/routes.ts`：将未匹配路由从粗暴跳转 `/home` 优化为渲染 404 引导页，并注册 `/500` 路由。
- **6. 模块化页脚与组件统一导出 (Footer & Components)**：
  - 新增 `frontend/apps/portal/src/components/Footer/index.tsx`：抽离 [app.tsx](file:///D:/work/go-zero-boilerplate/frontend/apps/portal/src/app.tsx) 中冗长的内联 `DefaultFooter`。
  - 新增 `frontend/apps/portal/src/components/index.ts`：提供组件统一入口。

## Capabilities

### New Capabilities
- `portal-architecture-alignment`: 涵盖 Portal 官方门户应用的本地公共静态资产、全局样式与自适应滚动条、全局类型、私有常量、浏览器工具库、404/500 异常页及模块化页脚。

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **受影响代码**：
  - `frontend/apps/portal/index.html`
  - `frontend/apps/portal/src/main.tsx`
  - `frontend/apps/portal/src/config/routes.ts`
  - `frontend/apps/portal/src/config/defaultSettings.ts`
  - `frontend/apps/portal/src/app.tsx`
- **无破坏性影响**：仅规范与补齐工程结构，现有首页、服务全景与工作台核心业务逻辑完全兼容。
