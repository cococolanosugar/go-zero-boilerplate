# Proposal: 数据字典前端二级缓存与响应式热更新 (Phase 2)

## Motivation
数据字典作为企业级中后台的核心基础设施，在全站几乎每一个列表、表单、详情中高频消费。当前脚手架存在三个短板：
1. **冷启动频繁发起 HTTP 请求**：仅在单个页面生命周期内存在内存 Map 缓存，刷新或开新 Tab 时必须重复请求后端字典接口。
2. **缺乏响应式状态驱动**：字典数据在管理中心被修改后，已挂载的组件无法感知，仍然展示过期的标签或文本。
3. **跨窗口缺乏同步通道**：无法在多标签页之间同步字典变更。
4. **业务代码缺乏声明式组件**：各业务页面手动手写 `colorMap` 与 `<Tag color={...}>{...}</Tag>`，存在重复代码与一致性风险。

## Proposed Changes
1. **L1 (Memory) + L2 (Storage with TTL) 二级缓存**：
   - 内存层：毫秒级极速命中，避免重复反序列化。
   - 持久化层：存入 LocalStorage，带 24 小时 TTL 与版本戳，实现新窗口/刷新 0ms 秒开。
2. **响应式全局事件总线 (DictEventEmitter)**：
   - 当任一字典数据被更新或刷新时，所有正在消费 `useDict` 的组件自动静默重绘。
3. **跨标签页广播同步通道 (BroadcastChannel + storage fallback)**：
   - 在 `/system/dicts` 中新增、修改、删除或手动刷新字典时，自动向全浏览器 Tab 派发广播，各 Tab 即时更新。
4. **声明式 Ant Design 6.x 字典组件库**：
   - `<DictTag dictType="..." value={...} />`
   - `<DictBadge dictType="..." value={...} />`
   - `<DictSelect dictType="..." ... />`
5. **在业务页面中集成验证**：
   - 在 `SysNotice`、`SysPost`、`Users` 等模块中落地声明式字典组件，并通过 Vitest 单元测试覆盖。

## Impact
- 大幅降低网关及下游 RPC 字典接口的并发请求压力。
- 实现真正的全站热更新体验，提升企业级运维与开发效率。
