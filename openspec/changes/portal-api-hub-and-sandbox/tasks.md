## 1. 数据模型与契约解析引擎 (Data Models & Contract Parser)

- [x] 1.1 在 `frontend/apps/portal/src/pages/ApiHub/types.ts` 定义全套 API 契约强类型（`ApiEndpointVO`、`ApiParamVO`、`ApiCategoryVO`、`SandboxResult`）
- [x] 1.2 在 `frontend/apps/portal/src/pages/ApiHub/manifest.ts` 沉淀全量微服务内置契约字典（覆盖 User, Task, ITSM, Titan, Dashboard 6 大业务模块），保障 100% 离线高可用
- [x] 1.3 在 `frontend/apps/portal/src/pages/ApiHub/parser.ts` 实现契约加载器，动态探测网关 `/openapi` 或 `/swagger.json` 并平滑映射为结构化树形数据

## 2. 多语言代码生成与沙箱执行引擎 (Code Generator & Sandbox Runner)

- [x] 2.1 在 `frontend/apps/portal/src/pages/ApiHub/codeGenerator.ts` 实现四语言代码生成引擎（`cURL`、`Go SDK`、`TypeScript (@zero/api)`、`Python`），参数变更时实时响应更新
- [x] 2.2 在 `frontend/apps/portal/src/pages/ApiHub/sandboxRunner.ts` 实现沙箱执行通道，自动注入 `Bearer <JWT>` Token，精确捕获网络响应状态码、毫秒级延迟与错误异常

## 3. Stripe 风格黄金三栏交互组件 (Three-Column UI & Subcomponents)

- [x] 3.1 开发左栏导航树组件 `ApiTree.tsx`：支持 Method 动词彩色微标（GET/POST/PUT/DELETE）、模块折叠、实时关键词全文模糊检索与高亮
- [x] 3.2 开发中栏契约详情与参数表单 `ApiDocDetail.tsx`：展示接口描述、Path/Query/Body 参数列表，提供交互式参数输入与 JSON 语法合法性校验
- [x] 3.3 开发右栏代码示例与控制台 `ApiConsole.tsx`：集成多语言代码选项卡切换、一键复制、测试发送按钮与结构化 JSON 响应高亮卡片
- [x] 3.4 组装三栏主页面 `frontend/apps/portal/src/pages/ApiHub/index.tsx`：整合左中右三栏，并基于 `Grid.useBreakpoint` 支持小屏/移动端折叠降级为 Tab 视图

## 4. 导航集成、路由升级与全量验证 (Navigation & Quality Gate)

- [x] 4.1 在 `frontend/apps/portal/src/config/routes.ts`、主布局菜单及中英多语言字典中挂载「API 契约集市」一级入口，并平滑兼容 `/workbench` 路由
- [x] 4.2 执行 Ant Design 6.x Lint 静态扫描：运行 `npx antd lint ./frontend/apps/portal/src` 确保 0 警告、0 废弃项
- [x] 4.3 执行前端自动化测试套件与全量构建：运行 `pnpm test` 与 `pnpm --filter @zero/portal build` 确保 100% 通过
