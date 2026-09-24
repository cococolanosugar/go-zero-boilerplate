## Context

Titan 交付平台（`frontend/apps/titan`）基于 Ant Design 6.x 与 Ant Design ProComponents 构建。当前交互与排版默认面向宽屏桌面设计（包含 2D 交付矩阵大盘、桌面级右键 Multi-Tabs、固定 400px~880px 宽度的侧滑抽屉与密集表单横排）。在移动端（手机与窄屏平板，视口 `< 768px`）下，这些桌面级元素导致横向溢出截断、操作失调与浏览阻断。

## Goals / Non-Goals

**Goals:**
- **自适应视口外壳**：顶栏操作区在窄屏下自动缩容，将外部系统跳转下沉至头像菜单，隐藏语言文字；在移动端自动收纳 `WorkspaceTabs` 释放垂直空间。
- **全屏抽屉规范**：全局所有 Drawer 在移动端自适应为 `100%` 满屏，并适配底部安全区。
- **交付矩阵移动端卡片流**：移动端以「环境 Segmented 分段器 + 服务卡片流」替代固定宽度的 2D 二维宽表。
- **移动端表单与终端自适应**：发布单动态服务表单改为垂直卡片，极客控制台工具条支持小屏折叠。
- **0 告警与代码质量**：严格保持 Ant Design 6.x 规范，0 废弃 API、0 Lint 警告、100% 编译与测试通过。

**Non-Goals:**
- 不开发独立的移动端 H5 独立工程（保持 Fullstack Monorepo 统一代码仓，采用响应式断点统一交付）。
- 不破坏 PC 宽屏端的紧凑大盘与 2D 矩阵桌面体验。

## Decisions

### 1. 基于 Ant Design 原生 `Grid.useBreakpoint` 的统一样式断点
- **决策**：统一采用 `const screens = Grid.useBreakpoint(); const isMobile = !screens.md;`（即 `< 768px`）判定移动端。
- **理由**：与 Ant Design ProLayout 原生抽屉断点完全契合，保证 Layout、Tabs、Drawers、Table 在同一断点下联动切换，杜绝散落媒体查询导致状态不一致。

### 2. 顶栏操作区空间分级与沉降
- **决策**：
  - 桌面端：完整展示项目切换器、技术门户按钮、管理后台按钮、暗黑切换与语言切换。
  - 移动端：
    - 项目选择器简化为微型胶囊（隐藏文字描述与 `Ctrl+K` 物理快捷键，最大宽度 80px）；
    - “技术门户”与“管理后台”外部导航移入头像 Dropdown 菜单；
    - 语言切换按钮隐藏“简体中文”文本，仅保留地球图标；
    - 为汉堡折叠菜单留出充足头部空间。

### 3. 多页签工作台移动端条件挂载
- **决策**：在 `TitanLayout` 中根据 `screens.md` 控制 `WorkspaceTabs` 的渲染，移动端（`!screens.md`）不挂载页签横栏。
- **理由**：移动端垂直视口极为珍贵（38px 占比高），且触屏无法触发右键上下文菜单，Tab 上的 12px 关闭图标误触率极高。移动端依靠 ProLayout 侧滑抽屉与浏览器的原生后退即可获得更自然的体验。

### 4. 交付矩阵「双模渲染」架构（Dual-Mode Architecture）
- **决策**：
  - 桌面端（`screens.md === true`）：保留 `DeliveryMatrixGrid` 二维泳道大盘。
  - 移动端（`screens.md === false`）：切换为 `DeliveryMatrixMobileCards` 组件：
    - 统计卡片：`<Col xs={12} sm={12} md={6}>`，手机端 2x2 网格排列；
    - 环境分段控制器：`<Segmented block options={envs} value={activeEnv} />`；
    - 微服务卡片流：纵向展示当前环境下的微服务卡片，包含 Pod 副本比、版本号、`StatusBadge` 呼吸灯微状态与一键晋级动作。

### 5. 抽屉全宽与触控安全区适配
- **决策**：
  - 将 `ProjectSwitcherDrawer`、`MatrixDiffDrawer`、`CreateReleaseDrawer`、`ExecutionDetailDrawer`、`HistoryDrawer` 的宽度统一定义为 `size={isMobile ? "100%" : defaultSize}`。
  - 底部操作按钮添加 `paddingBottom: "max(16px, env(safe-area-inset-bottom))"`，防止被全面屏底部指示条遮挡。

## Risks / Trade-offs

- **[Risk] 移动端卡片流模式与桌面端表格状态同步**  
  → **Mitigation**：将矩阵数据模型与晋级回调保持一致，卡片流与表格共享完全相同的数据源（`MatrixServiceRowVO`）和 Diff 抽屉打开逻辑。
- **[Risk] 移动端切换时 SSR 或初始渲染短暂跳闪**  
  → **Mitigation**：使用 `Grid.useBreakpoint` 并设置安全的默认值，确保客户端水合稳定平滑过渡。
