## ADDED Requirements

### Requirement: Portal API 契约集市主导航接入
技术门户全局主导航与顶栏菜单 SHALL 新增「API 契约集市」一级核心导航入口（路由 `/api-hub`），并提供醒目的接口契约与沙箱图标；同时系统 SHALL 保持对历史 `/workbench` 路由的访问重定向或平滑升级兼容，引导开发者体验全新的三栏式沙箱交互。

#### Scenario: 顶栏导航直达 API 契约集市
- **WHEN** 用户点击门户顶栏的「API 契约集市」导航项
- **THEN** 系统直接路由进入 `/api-hub` 三栏契约交互中心，默认加载并解析最新全量微服务 API 列表

#### Scenario: 历史联调工作台路由平滑兼容
- **WHEN** 用户通过书签或历史链接访问 `/workbench`
- **THEN** 系统平滑重定向或展示升级后的全功能 API Hub & Sandbox 界面，保持操作心智连续
