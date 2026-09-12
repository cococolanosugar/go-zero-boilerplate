# Design: 前端通用数据字典 Hook (useDict) 架构设计

## 1. 架构总览与数据流

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
| In-Memory & Storage Cache     | | @zero/api.getDictDataByType   |
| (TTL: 10 minutes)             | | GET /api/v1/system/dict/data  |
+-------------------------------+ +-------------------------------+
```

---

## 2. API 接口定义

```typescript
export interface DictItem {
  dictLabel: string;
  dictValue: string;
  listClass?: string;
  isDefault?: number;
  status?: number;
  remark?: string;
}

export interface DictResult {
  /** 原始字典列表 */
  raw: DictItem[];
  /** 下拉框/单选框标准 options 数据源 */
  options: Array<{ label: string; value: string; originalValue: string }>;
  /** Ant Design ProTable valueEnum 结构映射 */
  valueEnum: Record<string, { text: string; status?: 'Success' | 'Error' | 'Default' | 'Processing' | 'Warning'; color?: string }>;
  /** 获取指定 value 的文本 Label */
  getLabel: (value: any) => string;
  /** 获取指定 value 的 Tag 颜色属性 */
  getTagColor: (value: any) => string;
}

export interface UseDictReturn {
  [dictType: string]: DictResult;
  loading: boolean;
  refresh: () => Promise<void>;
}
```

---

## 3. 颜色与状态映射规则 (listClass)

将后端的 `listClass` 智能映射为 Ant Design 的语义状态或色彩：
- `success` / `1` / `primary` -> `Success` / `green`
- `error` / `danger` -> `Error` / `red`
- `warning` -> `Warning` / `orange`
- `processing` / `info` -> `Processing` / `blue`
- `default` / 其它 -> `Default` / `default`

---

## 4. 业务落地场景

在通知公告页面 (`frontend/apps/admin/src/pages/System/Notice/index.tsx`)：
- 替换硬编码的 `noticeType` 字典定义（`{ 1: '通知', 2: '公告' }`）
- 替换硬编码的 `status` 字典定义（`{ 1: { text: '正常' }, 0: { text: '关闭' } }`）
- 使用 `useDict('sys_notice_type', 'sys_notice_status')` 动态驱动 ProTable 列与筛选器！
