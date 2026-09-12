# 前端通用数据字典 Hook 与 ProTable 深度融合设计方案 (useDict)

本文档记录 `go-zero-boilerplate` 前端管理后台数据字典 React Hook (`useDict`) 的架构设计、缓存策略、ProTable/Form 强类型适配与业务落地实践。

---

## 1. 架构目标与解决的核心痛点

在传统前端中后台应用中，字典往往存在以下痛点：
1. **硬编码散落**：页面各处散落字面量枚举（如 `{ 1: '正常', 0: '停用' }`），后端字典表一旦更新，前端界面全部失步。
2. **重复网络请求**：多个组件或路由切页时对同一字典（如通用状态）反复发起 HTTP 请求。
3. **缺少与 Ant Design 6.x / ProComponents 深度集成**：开发者需要手动把列表组装成 Select `options` 或 ProTable `valueEnum`。

`useDict` 提供一站式极速响应与优雅调用体系：
```text
+-------------------------------------------------------------+
|               React UI Component (ProTable / Form)           |
|                                                             |
| const { sys_notice_type } = useDict('sys_notice_type')     |
| <ProTable columns={[{ valueEnum: sys_notice_type.valueEnum }]}/> |
+------------------------------+------------------------------+
                               |
                               v
               +-------------------------------+
               |     useDict Hook Core Logic   |
               |                               |
               | - Multi-type batch resolution |
               | - In-flight deduplication     |
               | - Reactive state notification |
               +---------------+---------------+
                               |
                +--------------+--------------+
                |                             |
      (Cache Hit)                             (Cache Miss)
                v                             v
+-------------------------------+ +-------------------------------+
| In-Memory Cache (TTL: 10 min) | | @zero/api.getDictDataByType   |
| (Zero redundant network calls)| | GET /api/v1/system/dict/data  |
+-------------------------------+ +-------------------------------+
```

---

## 2. 核心特性与技术实现

### 2.1 多调用范式与 100% 向后兼容
- **单字典解构**：
  ```tsx
  const { options, valueEnum, getLabel, getTagColor } = useDict('sys_common_status');
  ```
- **多字典批量加载**：
  ```tsx
  const { sys_notice_type, sys_common_status, loading } = useDict(
    'sys_notice_type',
    'sys_common_status'
  );
  ```

### 2.2 防竞态并发去重 (In-Flight Deduplication) 与 TTL 缓存
- 维护 `inFlightPromises` Map，当同一页面有多个子组件在同一时间渲染并请求相同字典时，底层自动合流为单次 HTTP 请求。
- 维护带 10 分钟 TTL 的客户端内存缓存，提供 `refresh()` 与 `clearDictCache(dictType?)` 方法支持后台字典更新后精准失效。

### 2.3 Ant Design Pro 组件无缝适配
- **ProTable `valueEnum`**：
  后端 `listClass` 字段自动映射至 Ant Design 6.x 语义状态：
  - `success` -> `status: 'Success'`（绿色圆点）
  - `error` / `danger` -> `status: 'Error'`（红色圆点）
  - `warning` -> `status: 'Warning'`（橙色圆点）
  - `processing` / `info` / `primary` -> `status: 'Processing'`（蓝色圆点）
  - 自定义色号（如 `#722ed1`）-> `color: '#722ed1'`
- **Form / ProFormSelect `options`**：
  自动适配数字值与字符串值，字典值为纯数字时提供数字转换，完美解决表单初值 `initialValues={1}` 匹配问题。

---

## 3. 生产业务页面实测落地

已将 `useDict` 落地至系统通知公告管理 (`SysNotice/index.tsx`) 与岗位信息管理 (`SysPost/index.tsx`)：
- 彻底移除了原先手写的 4 处硬编码对象。
- 经由 Chrome DevTools 浏览器实测，ProTable 徽标与 ModalForm 下拉选择器完全由后端字典数据实时驱动渲染。
