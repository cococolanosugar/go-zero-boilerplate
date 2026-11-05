## Context

统一网关（`app/gateway`）作为整个大仓微服务体系唯一的 HTTP 流量入口，对外暴露了用户中心、系统治理、仪表盘、异步任务、ITSM 流程、Titan 交付等上百个 RESTful 路由。虽然底层已由 `gateway.api` 契约驱动，但在技术门户 `apps/portal` 中，目前仅有静态技术介绍页与硬编码若干测试按钮的旧版 `Workbench`。

本技术方案旨在设计一套轻量、高性能且与 Ant Design 6.x 深度契合的**交互式 API 契约集市与在线调试沙箱中心（API Hub & Interactive Sandbox）**。

## Goals / Non-Goals

**Goals:**
- **原生 Ant Design 6.x 黄金三栏设计**：左侧分类导航树、中间契约表单、右侧代码生成与沙箱控制台，100% 继承 Portal 的主题（明/暗模式）与国际化机制。
- **免依赖原生轻量解析引擎**：不引入臃肿的 `swagger-ui-react`（10MB+ 打包体积且样式难以定制），采用轻量化 OpenAPI 契约解析器，秒级加载。
- **双模契约源保障（Live + Fallback）**：优先从网关动态拉取最新 Swagger/OpenAPI 定义；在网关未启动或离线模式下，内置全模块 API 契约 Fallback 字典，保证门户 100% 高可用。
- **自动化代码片段生成器**：根据当前选中的 Path、Query、Body 实参，动态输出 `cURL`、`Go SDK`、`TypeScript (@zero/api)` 与 `Python` 四种技术栈代码。
- **智能鉴权注入**：与 Portal `useAuth()` 上下文绑定，登录后自动在 Header 中注入当前用户的 Bearer Token。

**Non-Goals:**
- 不在网关增加额外的 Mock 数据库引擎，沙箱调用直连网关代理真实接口。
- 不替代后端 `goctl api` 代码生成流程，专注于“展示、检索、代码示例、在线调用调试”。

## Decisions

### 1. 采用原生 Ant Design 6.x 组件自研三栏架构，放弃嵌入 Swagger-UI/Redoc
- **决策背景**：业内通用方案往往是直接 iframe 嵌入 Swagger-UI 或 Redoc。
- **劣势**：
  - Swagger-UI 体积极大（压缩后超 3MB，未压缩 10MB+），严重拖慢门户首次渲染；
  - 样式与 Ant Design 6.x 割裂，无法跟随 Portal 切换深色主题（Real Dark）；
  - 无法定制 `@zero/api` 强类型 SDK 代码示例。
- **技术选型**：基于 Ant Design 的 `ProCard`、`Tree`、`Form`、`Tabs`、`Segmented` 构建原生三栏，配合极简轻量 JSON 高亮组件，首屏加载小于 15KB，视觉浑然一体。

### 2. 双模契约加载策略与规范化数据结构
- **契约转换通道**：
  ```ts
  interface ApiEndpointVO {
    id: string;              // 唯一标识, e.g. "titan-create-project"
    tag: string;             // 业务分类, e.g. "Titan 研发交付"
    name: string;            // 中文摘要, e.g. "创建项目空间"
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;            // 路由路径, e.g. "/api/v1/titan/projects"
    description?: string;
    authRequired: boolean;   // 是否需要 JWT
    parameters?: ApiParamVO[];
    requestBodyExample?: Record<string, any>;
    responseExample?: Record<string, any>;
  }
  ```
- **加载策略**：
  1. 页面初始化尝试异步请求 `GET /openapi` 或 `GET /swagger.json`。
  2. 请求成功则动态解析 OpenAPI 结构映射为 `ApiEndpointVO[]`。
  3. 请求失败或网络离线时，即时切换至内置静态契约库（涵盖 User, Task, ITSM, Titan, Dashboard 6 大模块 40+ 核心接口）。

### 3. 四语言动态代码生成器 (Snippet Generator)
- 纯前端无状态模板函数：
  - `generateCurl(endpoint, headers, body)`: 生成标准可执行 curl 命令，带 `-H "Authorization: Bearer ..."`。
  - `generateTypeScript(endpoint, body)`: 映射到 `@zero/api` SDK 的具体导出函数名（如 `await titanCreateProject(body)`）。
  - `generateGo(endpoint, body)`: 生成原生 Go `http.NewRequestWithContext` 样例。
  - `generatePython(endpoint, body)`: 生成 `requests.post(...)` 样例。

### 4. 移动端与平板响应式降级策略
- 当视口宽度 `< 992px` 时：
  - 自动将三栏横向排列折叠为 Tab 切换模式：`[ 📚 接口目录 ]`、`[ 📄 接口说明与表单 ]`、`[ 💻 代码与测试结果 ]`。
  - 支持在目录中点击某接口后自动平滑滚动或切换至详情 Tab，保持单手触控流畅体验。

## Risks / Trade-offs

- **[Risk] 参数较多的 POST 接口表单过长**  
  → *Mitigation*: 采用“JSON 原始编辑”与“键值对表单”双模输入切换，复杂嵌套结构直接在 CodeEditor/TextArea 中编辑，带实时 JSON 语法合法性校验。
- **[Risk] 网关跨域或接口 401 报错影响使用心情**  
  → *Mitigation*: 在沙箱控制台明确标识状态码徽章（如绿色 200、橙色 401、红色 500），并针对 401 提供一键唤起 Portal 登录弹窗的快捷按钮。
