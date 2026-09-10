## 1. P0 体验与稳定性：首屏 PageLoading 守卫与水印/紧凑模式

- [x] 1.1 在 `BasicLayout.tsx` 和 `PortalLayout.tsx` 中增加 `if (initialState.loading) return <PageLoading />` 拦截，并编写单元测试验证首屏加载态
- [x] 1.2 扩展 `LayoutSettingsContext.tsx`，添加 `watermark` 与 `compact` 属性及切换方法，并在 `Root.tsx` 中注入 `theme.compactAlgorithm`
- [x] 1.3 在 `BasicLayout` 的 `SettingDrawer` 与 `waterMarkProps` 中动态绑定 `settings.watermark` 与 `settings.compact`，验证本地持久化

## 2. P1 生产力范式：经典业务页面 Archetypes

- [x] 2.1 创建 `/workplace` (工作台) 页面：集成问候名片 Banner、团队统计指标、`ProCard` 项目卡片网格与最近活动流
- [x] 2.2 创建 `/form/step-form` (分步向导表单) 页面：使用 ProComponents `StepsForm` 实现三步向导（转账信息 $\rightarrow$ 确认信息 $\rightarrow$ 完成凭证）
- [x] 2.3 创建 `/profile/advanced` (高级详情页) 页面：实现单据进度 Steps、`ProDescriptions` 概览、嵌套明细子表与审批时间线
- [x] 2.4 创建 `/result/success` (操作结果反馈页) 页面：实现标准操作结果卡片展示与后续动作引导
- [x] 2.5 在静态路由 `routes.tsx` 与动态菜单映射中注册上述 4 个页面路由并验证正常访问

## 3. P1 数据治理：ProTable 批量操作与数据导出

- [x] 3.1 在 `Orders` 订单管理页面启用 `rowSelection`，配置 `tableAlertRender` 与 `tableAlertOptionRender` 批量操作浮动警示条
- [x] 3.2 封装 CSV 数据导出工具函数并在表格工具栏挂载「导出数据」操作，验证导出行为

## 4. P2 极客交互与长链接：Spotlight 命令面板与网关 SSE

- [x] 4.1 创建 `CommandPalette.tsx` 组件，监听全局 `Ctrl+K` / `Cmd+K` 快捷键，支持全量菜单模糊搜索与快捷动作，并挂载于基础布局
- [x] 4.2 在网关 `app/gateway` 增加 `/api/v1/system/notice/stream` SSE 实时事件流路由与原生 Handler
- [x] 4.3 在前端 `NoticeIcon` 中建立 EventSource 连接，实现网关实时消息推送与 Badge 未读数自动跳动

## 5. 开发体验 (DX)：OpenAPI / Swagger 接口文档

- [x] 5.1 在 `justfile` 增加 `just gen-swagger`，调用 `goctl api swagger` 导出最新 OpenAPI 契约至 `manifest/swagger/gateway.json`
- [x] 5.2 将 OpenAPI 契约提供给前端静态访问，并在管理后台顶部工具栏增加「API 文档」直达入口与预览页面

## 6. 全面验证与质量回归

- [x] 6.1 运行 `just test-frontend` 确保所有单元测试 100% 通过
- [x] 6.2 运行 `just lint-antd` 与 `just build-frontend` 确保 0 废弃项且双端生产编译成功
