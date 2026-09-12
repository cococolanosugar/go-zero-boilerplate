# Proposal: 前端通用数据字典 Hook 与 ProTable 深度融合 (useDict)

## 1. 业务背景与问题阐述 (Why)

在企业级中后台管理系统（如 RuoYi、LinaPro、Ant Design Pro）中，数据字典（如性别、状态、通知类型、岗位分类等）是支撑表单选择与表格渲染的核心基础设施。
目前 `go-zero-boilerplate` 的现状如下：
1. **数据散落与硬编码**：管理后台中的多个页面（如通知公告、部门管理、岗位管理）在 ProTable 的 `valueEnum` 或 Form 的 `options` 中手写了固定的字面量对象（例如 `{ 1: '通知', 2: '消息' }`）。
2. **字典变更无法实时联动**：虽然后端已经完整支持并落地了 `sys_dict_type` 与 `sys_dict_data` 接口（`GET /api/v1/system/dict/data/type/:dictType`），但前端缺乏优雅、自动缓存的响应式 Hook，导致业务开发体验差且难以享受字典动态维护红利。
3. **缺少 Ant Design 6.x 样式映射**：后端的 `list_class`（如 `success`, `warning`, `processing`, `error`, `default`）无法自动转换为 Ant Design 语义化 `<Tag>` 或 ProTable 状态徽标。

## 2. 方案与核心价值 (What)

1. **企业级 React Hook (`useDict`)**:
   - 支持单字典或多字典批量并行加载：`const { sys_notice_type, sys_common_status } = useDict('sys_notice_type', 'sys_common_status');`
   - 内置二级缓存机制（内存快照 + Session/LocalStorage TTL 防抖缓存），相同字典在跨组件或页面切换时 0 额外网络开销，支持手动 `refresh()` 触发字典失效重载。
2. **与 Ant Design Pro 极速联动**:
   - 每个字典实例提供：
     - `options`: 自动清洗为 `{ label, value }[]`，直接透传给 `<Select />` 或 `<Radio.Group />`。
     - `valueEnum`: 自动格式化为 `{ [value]: { text, status } }`，直接透传给 ProTable `columns[i].valueEnum`。
     - `getTag(value)`: 自动渲染符合 Ant Design 6.x 语义化的 `<Tag color="...">`。
     - `getLabel(value)`: 快速获取文本名称。
3. **真实业务页面无缝重构**:
   - 重构通知公告管理 (`Notice/index.tsx`) 或相关系统页面，彻底消除所有硬编码字典字面量。
4. **高质量自动化测试保障**:
   - 编写 Vitest 单元测试覆盖缓存命中、结构转换、批量获取与异常降级等场景，保证 100% 测试通过且 `just lint-antd` 0 警告。
