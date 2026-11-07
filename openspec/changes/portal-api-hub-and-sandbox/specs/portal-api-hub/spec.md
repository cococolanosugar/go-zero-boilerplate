## Purpose

为技术门户提供企业级交互式 API 契约集市与在线调试沙箱中心，支持 OpenAPI 3.0 / Swagger 动态解析、分类与模糊搜索、Stripe 风格黄金三栏交互布局、实时请求构建与鉴权注入（Try-It-Out）、多语言强类型 SDK 调用代码生成与结构化响应指标可视化。

## ADDED Requirements

### Requirement: OpenAPI 3.0 契约动态解析与分组检索
系统 SHALL 提供统一契约加载与解析器，动态拉取统一网关导出的 OpenAPI 3.0 / Swagger 规范定义；按业务标签（Tags，如 User、ITSM、Titan、Task、Dashboard）自动构建分类目录树，并为每个接口标注标准 HTTP Method 彩色微标（`GET`/`POST`/`PUT`/`DELETE`）；支持在顶栏按路径、接口摘要或方法名进行实时全文搜索。

#### Scenario: 动态解析网关契约并分类渲染
- **WHEN** 开发者访问 `/api-hub` 接口集市页面
- **THEN** 系统解析网关 OpenAPI 契约，在左侧目录呈现按业务模块归类的接口列表，标明 HTTP 动词与接口中文描述

#### Scenario: 实时关键词模糊检索与高亮
- **WHEN** 开发者在搜索框输入 `projects` 或 `审批`
- **THEN** 左侧树即时收缩过滤仅保留匹配项，高亮关键词，并在选中时联动中间契约说明区

### Requirement: Stripe 风格黄金三栏交互布局
API 集市页面 SHALL 采用业界标杆的三栏协作布局：左栏为接口分组导航树；中栏为接口详细契约说明（Path 参数、Query 参数、Request Body JSON Schema、Response 结构定义）及动态可编辑请求表单；右栏为多语言调用代码示例与沙箱执行结果控制台。

#### Scenario: 切换接口三栏实时同步联动
- **WHEN** 开发者在左栏点击某一具体接口（如 `POST /api/v1/titan/projects`）
- **THEN** 中栏自动呈现该接口的完整参数表单与字段必填说明，右栏自动更新对应的代码调用示例并重置沙箱输出

#### Scenario: 响应式断点平滑回退
- **WHEN** 视口在窄屏或移动端设备（宽度 `< 992px`）下访问
- **THEN** 界面自适应为上下堆叠或 Tab 分页标签布局，确保参数表单与测试执行全功能可用

### Requirement: 统一鉴权注入与在线沙箱执行 (Try-It-Out)
系统 SHALL 提供在线调试执行器；当当前用户处于登录状态时，系统 SHALL 自动将当前用户的 JWT Token 注入到请求头的 `Authorization: Bearer <token>` 中，无需人工拷贝；支持开发者自定义编辑请求参数与 Request Body JSON，点击“发送请求 (Send Request)”后经由网关代理发起实际调用，并展示 HTTP 状态码、真实响应耗时（ms）与格式化 JSON 结果。

#### Scenario: 自动注入登录凭据并发起实时调用
- **WHEN** 已登录的开发者在调试表单中输入参数并点击“发送请求”
- **THEN** 请求自动携带当前有效 JWT 凭据发送至网关，右栏控制台展示 HTTP 200 状态徽章、耗时以及高亮 JSON 响应体

#### Scenario: 访客未登录态友好提示与只读防护
- **WHEN** 未登录访客尝试调试需鉴权的有状态写接口
- **THEN** 系统弹出登录引导提示或安全警告，但允许查看文档与多语言代码示例

### Requirement: 多语言客户端 SDK 调用代码一键生成
系统 SHALL 根据当前选中的接口定义、填写的实时表单参数与请求体，动态生成至少四种主流技术栈的调用代码片段：`cURL`、`Go (HTTP/go-zero)`、`TypeScript (@zero/api SDK)`、`Python (requests)`；提供单键快速复制与语法着色功能。

#### Scenario: 动态生成带实际参数的代码片段
- **WHEN** 开发者在中栏修改了请求体参数并切换右栏语言选项卡至 `TypeScript SDK`
- **THEN** 右栏代码自动刷新为导入 `@zero/api` 强类型客户端调用的可运行代码，并提供复制按钮
