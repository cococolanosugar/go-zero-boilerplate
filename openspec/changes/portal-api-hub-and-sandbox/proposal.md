## Why

目前 `apps/portal` 的接口调试能力仅包含在 `Workbench` 中由若干硬编码按钮构成的简易联调页面，无法动态反映统一网关（Gateway）全量微服务 API 的契约定义，缺乏交互式参数构建、动态 Swagger/OpenAPI 解析、多语言 SDK 示例代码生成与沙箱结果可视化能力。

为了将 Portal 真正升级为业界标准的企业级开发者门户（Internal Developer Portal, IDP），我们需要构建统一的**「API 契约集市与在线调试沙箱中心 (API Hub & Interactive Sandbox)」**，对齐 Stripe 风格的黄金三栏交互标准，打通真实网关契约、身份鉴权透传、一键代码生成与即时沙箱调用。

## What Changes

- **新增全量交互式 API 契约集市 (`/api-hub`)**：
  - 动态接入统一网关 OpenAPI 3.0 / Swagger 契约源，自动按业务模块（User, System, Task, ITSM, Titan, Dashboard 等）生成分类树与 HTTP 方法标签（`GET`/`POST`/`PUT`/`DELETE`）。
  - 支持按路由 Path、接口名称、请求方法、标签进行毫秒级全文检索与模糊过滤。
- **Stripe 风格黄金三栏布局设计**：
  - **左栏**：分组接口目录树与快速定位索引。
  - **中栏**：接口契约详情、参数校验规则（Path/Query/Body）、可编辑的请求调试表单。
  - **右栏**：多语言调用代码示例（`cURL`、`Go SDK`、`TypeScript @zero/api`、`Python`）与实时沙箱运行结果控制台（延迟毫秒数、HTTP 状态码、格式化 JSON 高亮视图与一键复制）。
- **统一鉴权与沙箱调试 (Try-It-Out)**：
  - 自动从 Portal 登录会话中注入 `Bearer <JWT>` Token，支持免去手动复制 Authorization Header；
  - 针对未登录或公网只读接口提供安全防错提示；
  - 与网关实际服务联动，记录真实请求耗时与结构化响应。
- **导航联动与旧版 Workbench 平滑迁移**：
  - 更新 Portal 全局主导航，将「API 契约集市」提升为一级核心导航入口；
  - 旧版 `/workbench` 路由平滑重定向或升级为新版 API Hub，保证既有外链与用户心智连续性。

## Capabilities

### New Capabilities
- `portal-api-hub`: 交互式 API 契约集市与在线调试沙箱中心，提供动态 OpenAPI 契约解析、三栏布局交互、实时在线调试与多语言代码生成。

### Modified Capabilities
- `portal-navigation`: 更新 Portal 全局主导航与功能入口矩阵，新增「API 契约集市」一级导航项并平滑替代原静态测试页。

## Impact

- **前端应用**：`frontend/apps/portal`
  - 新增页面：`frontend/apps/portal/src/pages/ApiHub/index.tsx` 及子组件（`ApiTree.tsx`, `ApiDocDetail.tsx`, `ApiCodeSnippets.tsx`, `ApiConsoleResult.tsx`）。
  - 路由更新：`frontend/apps/portal/src/config/routes.ts` 与主导航项。
  - 国际化：中英多语言字典扩展（`zh-CN.ts`, `en-US.ts`）。
- **网关契约源**：消费 `app/gateway/desc/` 导出的 OpenAPI 3.0 契约或网关内置 `/openapi` / `/swagger.json` 端点。
- **依赖库**：复用现有的 Ant Design 6.x、ProCard、`@ant-design/icons`，引入极简语法高亮或复用已有的 JSON 格式化与剪贴板工具，无重型第三方侵入。
