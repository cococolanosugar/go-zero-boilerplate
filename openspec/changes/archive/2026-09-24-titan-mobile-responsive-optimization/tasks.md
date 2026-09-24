## 1. 响应式布局外壳与顶栏精简 (Responsive Layout Shell & Header)

- [x] 1.1 改造 `TitanLayout.tsx` 顶栏操作区：基于 `Grid.useBreakpoint` 在移动端将“技术门户”与“管理后台”外部导航收纳进头像 Dropdown，语言切换按钮隐藏文本仅保留图标
- [x] 1.2 改造项目切换器与 WorkspaceTabs 条件渲染：移动端项目切换器转为微型胶囊形态，并在移动端窄屏下条件性卸载 `WorkspaceTabs`，释放 38px 垂直空间
- [x] 1.3 验证：通过视口调整至 375px~430px 验证顶栏元素排布紧凑无折行，汉堡菜单无遮挡

## 2. 全局抽屉全宽与底部安全区适配 (Full-width Drawers & SafeArea)

- [x] 2.1 重构 `ProjectSwitcherDrawer` 与 `MatrixDiffDrawer`：将宽度从固定像素改为 `size={isMobile ? "100%" : defaultSize}`，在手机端全宽展示并适配底部安全区
- [x] 2.2 重构 `CreateReleaseDrawer`、`ExecutionDetailDrawer` 与 `HistoryDrawer`：统一引入全宽自适应，解决移动端横向溢出问题
- [x] 2.3 验证：在移动端打开各类 Drawer，抽屉 100% 满屏覆盖且关闭按钮与表单操作全部可正常触达

## 3. 交付矩阵移动端「环境分段器 + 卡片流」模式 (Delivery Matrix Mobile Cards)

- [x] 3.1 改造 `Matrix/index.tsx` 指标卡片网格：将 `<Col span={6}>` 调整为 `<Col xs={12} sm={12} md={6}>`，移动端 2x2 优雅排布
- [x] 3.2 开发 `DeliveryMatrixMobileCards.tsx`：为移动端提供 Segmented 环境分段器与纵向微服务卡片流，完整展示服务运行态、Pod 副本比与“从上一环境晋级”入口
- [x] 3.3 在 `Matrix/index.tsx` 中集成双模切换（桌面端宽表格 vs 移动端卡片流），并改造 `MatrixDiffDrawer` 内对比卡片为移动端纵向堆叠排布
- [x] 3.4 验证：在移动端查看 `/matrix` 页面，环境平滑切换，卡片信息清晰无横向滚动负担，可顺畅唤起晋级抽屉

## 4. 表单与控制台移动端细节优化 (Fluid Forms & Terminal Adaptation)

- [x] 4.1 优化 `CreateReleaseDrawer.tsx` 微服务添加表单：移动端由单行 4 列紧凑排布转为垂直卡片式表单项
- [x] 4.2 优化 `TerminalLogViewer`：窄屏下折叠控制台工具条，搜索框支持点击弹出展开，日志文本支持横向触控滑动
- [x] 4.3 优化 `ReleaseOrders/index.tsx`：为 ProTable 添加 `scroll={{ x: 1000 }}`，`Descriptions` 调整为单列响应式
- [x] 4.4 验证：在移动端完整走通新建发布单、查看控制台日志与发布单详情全链路

## 5. 质量门禁与全流程构建验证 (Verification & Quality Gate)

- [x] 5.1 执行 Ant Design 6.x Lint 静态扫描：运行 `npx antd lint ./frontend/apps/titan/src` 确保 0 警告、0 废弃项
- [x] 5.2 执行自动化测试与前端全量构建：运行 `pnpm test` 与 `pnpm --filter @zero/titan build` 验证 100% 通过

