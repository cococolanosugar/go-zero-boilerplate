## 1. 技术文档知识库与数据模型 (Documentation Dataset & Types)

- [x] 1.1 在 `frontend/apps/portal/src/pages/TechDocs/docsData.ts` 定义全套文档模型（`DocCategoryVO`, `DocChapterVO`, `DocHeadingVO`）并沉淀 5 大专栏（快速上手、架构守则、治理体系、异步编排、ADR决策库）共 10+ 篇深度技术文档
- [x] 1.2 在 `frontend/apps/portal/src/pages/TechDocs/types.ts` 定义目录过滤与阅读器上下文状态接口

## 2. 交互式三栏文档组件群 (Interactive Reader Subcomponents)

- [x] 2.1 在 `frontend/apps/portal/src/pages/TechDocs/components/DocTree.tsx` 实现左栏层级目录导航树，支持分类折叠、关键词全文过滤与文档总数统计
- [x] 2.2 在 `frontend/apps/portal/src/pages/TechDocs/components/DocViewer.tsx` 实现中栏文档结构化阅读区，支持标题锚点渲染、代码语法高亮排版、一键复制代码、Callout 提示框与上一篇/下一篇翻页
- [x] 2.3 在 `frontend/apps/portal/src/pages/TechDocs/components/DocToc.tsx` 实现右栏页内目录大纲（On This Page），支持平滑滚动与当前锚点跟踪高亮

## 3. 页面组装、导航集成与质量门禁 (Page Assembly & Quality Gate)

- [x] 3.1 在 `frontend/apps/portal/src/pages/TechDocs/index.tsx` 组装三栏主页面，支持桌面端三栏与移动端小屏响应式折叠
- [x] 3.2 在 `frontend/apps/portal/src/config/routes.ts`、主布局菜单及中英多语言字典挂载 `/docs` 一级入口
- [x] 3.3 在 `frontend/apps/portal/tests/techDocs.test.ts` 编写自动化单元测试，覆盖文档数据集完整性、目录过滤与上一篇/下一篇计算
- [x] 3.4 执行 Ant Design 6.x Lint 静态扫描与生产构建验证：运行 `npx antd lint ./frontend/apps/portal/src` 与 `pnpm --filter @zero/portal build` 确保 100% 通过
