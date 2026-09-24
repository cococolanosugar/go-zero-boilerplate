## Why

Titan 交付平台在宽屏 PC 端具备极佳的信息密度与全景矩阵掌控力，但在移动端与窄屏设备（视口宽度 ≤ 768px）上访问时存在顶栏操作区拥挤折行、Drawer 抽屉超宽截断、交付矩阵 2D 大表格无法拖动浏览、多页签（WorkspaceTabs）与触控体验失配等严重可用性问题。通过系统化建设移动端响应式架构，使研发负责人与 SRE 工程师能随时通过手机或平板进行跨环境交付矩阵巡检、发布单审批放行与流水线日志跟踪。

## What Changes

- **响应式导航外壳 (Responsive Shell & Header)**：在移动端自动收敛顶栏元素，项目切换器缩容为微型胶囊，外部系统链接（技术门户/管理后台）收纳至用户下拉菜单，语言切换精简为图标。
- **工作台多页签移动端适配 (Adaptive WorkspaceTabs)**：在移动端视口（`xs`）自动收敛 Multi-Tabs 栏，为手机屏幕释放垂直可视空间，依托 ProLayout 汉堡抽屉侧边栏提供原生触控导航。
- **全屏抽屉与安全区适配 (Full-width Drawers & SafeArea)**：重构全部 Drawer（项目切换、发布单新建、版本 Diff 对比、流水线执行详情等），在移动端自适应 `width="100%"`，避免视口截断并适配 iOS 底部安全距离（`safe-area-inset-bottom`）。
- **交付矩阵移动端卡片流模式 (Matrix Dual-Mode: Table vs Cards)**：交付矩阵看板在移动端自动由 2D 宽表格平滑转为「环境 Segmented 分段器 + 微服务卡片流」模式，彻底解决手机端宽表滑动艰难与统计指标挤压问题。
- **移动端表单与终端自适应 (Fluid Forms & Mobile Terminal)**：新建发布单微服务列表在移动端转为垂直卡片表单；ANSI 深色终端顶部工具栏在窄屏下折叠收纳，保证日志流式阅读体验。

## Capabilities

### New Capabilities
- `titan-mobile-responsive`: 定义移动端视口适配策略、触控热区（≥ 40px）、安全区域贴合以及全局抽屉全屏化规范。

### Modified Capabilities
- `titan-delivery-matrix`: 增加移动端环境分段器与微服务卡片流呈现需求，替代固定 240px 宽表格。
- `titan-project-workspace`: 优化顶栏项目空间切换器在移动端的胶囊化呈现与多页签在移动端的自适应收敛。
- `titan-dense-drawer-ux`: 增加抽屉与终端查看器在移动端的全宽自适应与响应式工具栏规范。

## Impact

- **受影响前端工程**：`frontend/apps/titan`（`src/layouts/TitanLayout.tsx`、`src/components/`、`src/pages/Matrix/`、`src/pages/ReleaseOrders/`、`src/pages/Pipelines/`）。
- **后端/RPC/契约**：纯前端视图与交互层重构，无需变更后端 Go 微服务 RPC 接口与网关 API。
- **依赖库规范**：严格遵循 Ant Design 6.x 的响应式栅格（`Grid.useBreakpoint` / `xs, sm, md, lg`），保持 0 警告、0 废弃 API。
