## Context

全栈大仓积累了深度的微服务架构规范与技术治理决策，目前散落在源码仓库中，Portal 缺乏集中式技术文档呈现中心。详见 `proposal.md`。

## Goals / Non-Goals

**Goals:**
- 提供现代化三栏（左目录 ➔ 中正文 ➔ 右页内大纲）交互式文档阅读器；
- 结构化收录 5 大核心领域知识：5分钟上手指南、微服务核心架构守则、企业级治理体系、异步工作流引擎、三大 ADR 决策专篇；
- 提供原生代码块语法高亮排版、一键复制、Callout 提示框；
- 提供页内大纲（On This Page）平滑锚点定位与上一篇/下一篇翻页导航；
- 100% 遵循 Ant Design 6.x 规范，自适应浅色与暗黑模式。

**Non-Goals:**
- 不依赖在线外部网络拉取 Markdown，所有核心文档沉淀为大仓内部静态强类型知识库，保证 100% 离线高可用。

## Decisions

### 1. 强类型结构化文档数据集架构 (`docsData.ts`)
- **决定**：定义强类型 `DocChapterVO` 与 `DocCategoryVO`，每个章节显式定义 `headings: { id: string; text: string; level: number }[]` 与预解析内容区块。
- **考量**：避免在客户端运行时引入庞大的外部 Markdown 编译器（如 markdown-it/marked + highlight.js），显著减少前端打包体积，提升加载速度（< 10ms），并为右侧 TOC 大纲提供 100% 精确的锚点跳转。

### 2. 响应式布局与小屏降级策略
- **决定**：桌面端（`>= 992px`）采用 `260px + 1fr + 200px` 黄金三栏布局；移动端（`< 992px`）自动隐藏右侧 TOC，并将左侧目录折叠为顶部抽屉或分段导航，确保在手机端依然拥有舒适阅读体验。

### 3. 全局路由与菜单集成
- **决定**：在 `frontend/apps/portal/src/config/routes.ts` 注册 `/docs` 路由（`menu.docs`），并在多语言字典中配置中文、英文、繁体词条，与门户现有设计风格保持 100% 一致。

## Risks / Trade-offs

- **[文档内容后续更新同步]** ➔ 结构化数据定义在 `docsData.ts` 中，与 `AGENTS.md` 对齐，后续更新仅需维护统一字典，变更清晰透明。
