## Purpose

构建企业级数据字典前端二级缓存、跨标签页实时广播通信与声明式组件体系，实现数据字典“秒开、零重复请求、全站响应式热更新”。

## Requirements

### Requirement: L1/L2 二级缓存与持久化
系统 SHALL 支持将字典数据同时缓存在前端运行内存（L1）与 LocalStorage 本地存储（L2），并附带 TTL 有效期（默认 24 小时）与版本校验。

#### Scenario: 页面加载与秒开
- **WHEN** 组件调用 `useDict(dictType)`
- **THEN** 系统优先从 L1 内存获取；若 L1 未命中则从 L2 LocalStorage 获取并反向填充 L1；若均未命中才发起 HTTP 请求并写回两级缓存。

### Requirement: 响应式事件驱动更新
系统 SHALL 在任一字典被更新或缓存清除时，响应式通知所有订阅了该字典的已挂载组件触发重新渲染。

#### Scenario: 字典实时热更新
- **WHEN** 某个字典项更新（无论是本地操作触发还是跨 Tab 广播通知）
- **THEN** 正在显示该字典标签的表格列或组件即刻自动刷新展示文本与回显颜色，无需用户手动刷新网页。

### Requirement: 跨标签页广播总线 (Cross-Tab Sync)
系统 SHALL 基于 `BroadcastChannel`（降级至 `storage` 事件）在多标签页之间实时广播字典更新通知。

#### Scenario: 管理员修改字典跨 Tab 同步
- **WHEN** 管理员在 Tab A 修改了字典类型为 `sys_notice_type` 的某个数据项
- **THEN** Tab B、Tab C 毫秒级收到通知，自动淘汰过期缓存并静默重拉最新字典数据。

### Requirement: 声明式 Ant Design 6.x 字典组件
系统 SHALL 提供开箱即用的 `<DictTag />`、`<DictBadge />` 与 `<DictSelect />` 组件。

#### Scenario: 表格列与表单消费
- **WHEN** 开发者需要在表格或表单中回显字典标签
- **THEN** 直接使用 `<DictTag dictType="sys_notice_type" value={val} />`，组件根据 `listClass` 自动自适应 Ant Design 6.x 色彩。
