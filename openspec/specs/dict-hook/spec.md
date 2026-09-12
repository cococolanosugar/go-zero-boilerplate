# Dictionary Hook Specification

## Purpose

为前端 Admin 提供开箱即用、具备自动缓存与高效状态管理的数据字典 Hook (`useDict`)，无缝适配 Ant Design ProTable `valueEnum` 与表单选择组件。

## Requirements

### Requirement: 响应式多字典加载与缓存
系统 SHALL 提供 `useDict(...types: string[])` Hook，支持同时请求多个字典类型并进行客户端高速缓存。

#### Scenario: 首次加载并写入缓存
- **WHEN** 组件调用 `useDict('sys_common_status')` 且本地缓存未命中
- **THEN** 系统发起异步请求获取字典数据并存入内存与本地存储，返回响应式字典对象

#### Scenario: 重复调用命中缓存
- **WHEN** 相同字典在短时间内由不同组件请求
- **THEN** 系统直接复用缓存数据，不产生重复 HTTP 请求

### Requirement: Ant Design Pro 强类型适配
系统 SHALL 将后端字典条目格式化为 ProTable 与 Form 直接可消费的 `options`、`valueEnum`、`getTag` 与 `getLabel` 接口。

#### Scenario: 渲染 ProTable 列枚举
- **WHEN** ProTable 列配置 `valueEnum={dict.sys_common_status.valueEnum}`
- **THEN** ProTable 正确显示状态标签与筛选器，且状态颜色匹配 `listClass`

#### Scenario: 渲染表单选择器
- **WHEN** 表单组件传入 `options={dict.sys_common_status.options}`
- **THEN** 下拉菜单正确展示所有字典选项并支持选中提交
