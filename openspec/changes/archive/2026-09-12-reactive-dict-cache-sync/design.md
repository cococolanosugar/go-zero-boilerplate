# Design: 数据字典前端二级缓存与响应式热更新架构设计

## 1. 缓存分级拓扑 (L1/L2 Cache Topology)

- **L1 运行内存 (Memory Map)**：
  - 存储对象：`Map<string, { data: SysDictDataItem[]; expireAt: number }>`
  - 职责：极速无损内存命中，同页面内多次消费零开销。
- **L2 本地持久化 (LocalStorage)**：
  - Key 前缀：`sys:dict:cache:<dictType>`
  - 结构：`{ version: string, data: SysDictDataItem[], expireAt: number }`
  - 职责：跨标签页共享持久化数据，页面刷新或开新窗口时即刻秒开。
- **In-Flight 防击穿防雪崩**：
  - 保持 `inFlightPromises` 机制，同一微秒多个组件请求相同字典时仅发出 1 次 HTTP 请求。

## 2. 响应式事件总线 (DictEventEmitter)

```ts
class DictEventEmitter {
  private listeners = new Map<string, Set<() => void>>();

  subscribe(dictType: string, callback: () => void): () => void {
    if (!this.listeners.has(dictType)) {
      this.listeners.set(dictType, new Set());
    }
    this.listeners.get(dictType)!.add(callback);
    return () => this.listeners.get(dictType)?.delete(callback);
  }

  notify(dictType: string): void {
    this.listeners.get(dictType)?.forEach(fn => fn());
    this.listeners.get('*')?.forEach(fn => fn());
  }
}
```

## 3. 跨标签页广播通信 (Cross-Tab Broadcast)

- 使用 `BroadcastChannel('zero_dict_sync_channel')`。
- 消息格式：`{ type: 'DICT_UPDATED', dictType: string, timestamp: number }`。
- 降级方案：若当前浏览器不支持 `BroadcastChannel`，通过更新 `localStorage.setItem('zero_dict_sync_flag', ...)` 并监听 `window.addEventListener('storage')` 触发。

## 4. 声明式组件设计 (Ant Design 6.x)

- **`<DictTag dictType="..." value={...} />`**：
  - 内部使用 `useDict(dictType)` 订阅字典变更。
  - 根据 `getTagColor(value)` 与 `getLabel(value)` 渲染 Ant Design 6.x Tag。
  - 支持 `showLabel={false}`、`bordered={false}`、自定义 fallback 等。
- **`<DictBadge dictType="..." value={...} />`**：
  - 提取字典状态，渲染 Ant Design 6.x Badge 徽标状态指示点。
- **`<DictSelect dictType="..." ... />`**：
  - 封装 Ant Design Select，自动注入 `options`，支持自适应数值与字符串转换。
