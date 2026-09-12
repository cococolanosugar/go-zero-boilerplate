import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDictDataByType, type SysDictDataItem } from '@zero/api';

export interface DictOption {
  label: string;
  value: string | number;
  stringValue: string;
  numberValue?: number;
  listClass?: string;
  raw: SysDictDataItem;
}

export type ProTableStatus = 'Success' | 'Error' | 'Default' | 'Processing' | 'Warning';

export interface ProTableValueEnumItem {
  text: string;
  status?: ProTableStatus;
  color?: string;
}

export type ProTableValueEnum = Record<string | number, ProTableValueEnumItem>;

export interface DictBundle {
  /** 原始字典数据列表 */
  data: SysDictDataItem[];
  /** 自适应类型 options（若为纯数字则转为 number，完美兼容 Form 与 ProFormSelect） */
  options: DictOption[];
  /** 纯字符串 value 的 options 列表 */
  stringOptions: Array<{ label: string; value: string; raw: SysDictDataItem }>;
  /** 纯数值 value 的 options 列表 */
  numberOptions: Array<{ label: string; value: number; raw: SysDictDataItem }>;
  /** ProTable columns valueEnum 规范对象 */
  valueEnum: ProTableValueEnum;
  /** 获取指定字典值的展示文本 */
  getLabel: (value: any) => string;
  /** 获取指定字典值的色彩/状态类名 */
  getTagColor: (value: any) => string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 默认 24 小时持久缓存
const L2_PREFIX = 'sys:dict:cache:';
const L2_VERSION_KEY = 'sys:dict:version';
export const CURRENT_DICT_VERSION = '1.0';
const BROADCAST_CHANNEL_NAME = 'zero_dict_sync_channel';
const STORAGE_SYNC_KEY = 'zero_dict_sync_flag';

// L1 极速内存缓存
const dictMemoryCache = new Map<string, { data: SysDictDataItem[]; expireAt: number }>();
// In-Flight 并发请求去重池
const inFlightPromises = new Map<string, Promise<SysDictDataItem[]>>();

/**
 * 响应式字典事件总线 (DictEventEmitter)
 * 当字典数据更新时通知所有订阅者静默重绘
 */
type DictListener = () => void;

export class DictEventEmitter {
  private listeners = new Map<string, Set<DictListener>>();

  subscribe(dictType: string, listener: DictListener): () => void {
    if (!this.listeners.has(dictType)) {
      this.listeners.set(dictType, new Set());
    }
    this.listeners.get(dictType)!.add(listener);
    return () => {
      this.listeners.get(dictType)?.delete(listener);
    };
  }

  /**
   * 别名方法，等同于 subscribe
   */
  on(dictType: string, listener: DictListener): () => void {
    return this.subscribe(dictType, listener);
  }

  emit(dictType?: string): void {
    if (dictType) {
      this.listeners.get(dictType)?.forEach((fn) => fn());
    }
    // 通知通配订阅者
    this.listeners.get('*')?.forEach((fn) => fn());
  }
}

export const dictEventEmitter = new DictEventEmitter();

/**
 * L2 本地持久化缓存读写器 (LocalStorage)
 */
function getFromL2(dictType: string): SysDictDataItem[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(L2_PREFIX + dictType);
    if (!raw) return null;
    const item = JSON.parse(raw);
    const versionMatch = String(item.version) === String(CURRENT_DICT_VERSION) || item.version === 1;
    if (!versionMatch || Date.now() > item.expireAt) {
      localStorage.removeItem(L2_PREFIX + dictType);
      return null;
    }
    return Array.isArray(item.data) ? item.data : null;
  } catch {
    return null;
  }
}

function saveToL2(dictType: string, data: SysDictDataItem[], ttl = CACHE_TTL): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const item = {
      dictType,
      version: CURRENT_DICT_VERSION,
      data,
      expireAt: Date.now() + ttl,
    };
    localStorage.setItem(L2_PREFIX + dictType, JSON.stringify(item));
  } catch {}
}

function removeFromL2(dictType?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (dictType) {
      localStorage.removeItem(L2_PREFIX + dictType);
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(L2_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
}

interface DictBroadcastMsg {
  type: 'DICT_UPDATED' | 'DICT_CLEARED';
  dictType?: string;
  timestamp: number;
}

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      const msg = event.data as DictBroadcastMsg;
      if (msg && (msg.type === 'DICT_UPDATED' || msg.type === 'DICT_CLEARED')) {
        handleExternalDictUpdate(msg.dictType);
      }
    };
  } catch {}
}

// 降级回退至 storage 事件通信（兼容不支持 BroadcastChannel 的环境）
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue) as DictBroadcastMsg;
        handleExternalDictUpdate(msg.dictType);
      } catch {}
    }
  });
}

function handleExternalDictUpdate(dictType?: string) {
  if (dictType) {
    dictMemoryCache.delete(dictType);
  } else {
    dictMemoryCache.clear();
  }
  dictEventEmitter.emit(dictType);
}

/**
 * 广播字典已更新/已清除（向当前页面及全浏览器其它 Tab 推送）
 */
export function broadcastDictUpdate(dictType?: string) {
  // 1. 本地更新 L1 & L2
  if (dictType) {
    dictMemoryCache.delete(dictType);
    removeFromL2(dictType);
  } else {
    dictMemoryCache.clear();
    removeFromL2();
  }

  // 2. 本地事件通知
  dictEventEmitter.emit(dictType);

  // 3. 跨 Tab 广播
  const msg: DictBroadcastMsg = {
    type: dictType ? 'DICT_UPDATED' : 'DICT_CLEARED',
    dictType,
    timestamp: Date.now(),
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(msg);
    } catch {}
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(msg));
    } catch {}
  }
}

/**
 * 底层字典数据加载与防竞态去重拉取器（L1 内存 + L2 存储二级命中）
 */
async function fetchDictData(dictType: string, force = false): Promise<SysDictDataItem[]> {
  if (!dictType) return [];

  // 1. L1 内存极速命中
  if (!force && dictMemoryCache.has(dictType)) {
    const cached = dictMemoryCache.get(dictType)!;
    if (Date.now() < cached.expireAt) {
      return cached.data;
    }
  }

  // 2. L2 本地持久化缓存命中（0ms 秒开）
  if (!force) {
    const l2Data = getFromL2(dictType);
    if (l2Data) {
      dictMemoryCache.set(dictType, { data: l2Data, expireAt: Date.now() + CACHE_TTL });
      return l2Data;
    }
  }

  // 3. 并发防重复请求 (In-Flight Deduplication)
  if (inFlightPromises.has(dictType)) {
    return inFlightPromises.get(dictType)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await getDictDataByType({}, dictType);
      const list = res?.list || [];
      // 写入 L1 内存与 L2 本地存储
      dictMemoryCache.set(dictType, { data: list, expireAt: Date.now() + CACHE_TTL });
      saveToL2(dictType, list, CACHE_TTL);
      return list;
    } catch (err) {
      console.warn(`[useDict] 加载数据字典 [${dictType}] 失败:`, err);
      return [];
    } finally {
      inFlightPromises.delete(dictType);
    }
  })();

  inFlightPromises.set(dictType, fetchPromise);
  return fetchPromise;
}

/**
 * 将原始字典列表解析为标准的 DictBundle
 */
export function buildDictBundle(rawList: SysDictDataItem[] = []): DictBundle {
  const options: DictOption[] = [];
  const stringOptions: Array<{ label: string; value: string; raw: SysDictDataItem }> = [];
  const numberOptions: Array<{ label: string; value: number; raw: SysDictDataItem }> = [];
  const valueEnum: ProTableValueEnum = {};
  const labelMap = new Map<string, string>();
  const colorMap = new Map<string, string>();

  for (const item of rawList) {
    const isNum = /^-?\d+$/.test(item.dictValue.trim());
    const numVal = isNum ? Number(item.dictValue.trim()) : undefined;
    const resolvedVal = numVal !== undefined ? numVal : item.dictValue;

    const opt: DictOption = {
      label: item.dictLabel,
      value: resolvedVal,
      stringValue: item.dictValue,
      numberValue: numVal,
      listClass: item.listClass,
      raw: item,
    };
    options.push(opt);
    stringOptions.push({ label: item.dictLabel, value: item.dictValue, raw: item });
    if (numVal !== undefined) {
      numberOptions.push({ label: item.dictLabel, value: numVal, raw: item });
    }

    labelMap.set(item.dictValue, item.dictLabel);
    if (numVal !== undefined) {
      labelMap.set(String(numVal), item.dictLabel);
    }

    const listClass = (item.listClass || '').toLowerCase().trim();
    let status: ProTableStatus | undefined;
    let color: string | undefined;

    if (listClass === 'success') status = 'Success';
    else if (listClass === 'error' || listClass === 'danger') status = 'Error';
    else if (listClass === 'warning') status = 'Warning';
    else if (listClass === 'processing' || listClass === 'info' || listClass === 'primary') status = 'Processing';
    else if (listClass === 'default') status = 'Default';
    else if (listClass) color = listClass;

    const enumItem: ProTableValueEnumItem = {
      text: item.dictLabel,
      ...(status ? { status } : {}),
      ...(color ? { color } : {}),
    };

    valueEnum[item.dictValue] = enumItem;
    if (numVal !== undefined) {
      valueEnum[numVal] = enumItem;
    }

    const tagColor = color || (status === 'Success' ? 'green' : status === 'Error' ? 'red' : status === 'Warning' ? 'orange' : status === 'Processing' ? 'blue' : 'default');
    colorMap.set(item.dictValue, tagColor);
    if (numVal !== undefined) {
      colorMap.set(String(numVal), tagColor);
    }
  }

  const getLabel = (val: any): string => {
    if (val === undefined || val === null) return '';
    return labelMap.get(String(val)) || String(val);
  };

  const getTagColor = (val: any): string => {
    if (val === undefined || val === null) return 'default';
    return colorMap.get(String(val)) || 'default';
  };

  return {
    data: rawList,
    options,
    stringOptions,
    numberOptions,
    valueEnum,
    getLabel,
    getTagColor,
  };
}

const emptyBundle = buildDictBundle([]);

/**
 * 企业级通用数据字典 Hook (useDict)
 *
 * 支持单字典或多字典加载、二级缓存秒开、响应式事件驱动自动重绘：
 * 1. 单字典：const { options, valueEnum, getLabel, getTagColor } = useDict('sys_common_status');
 * 2. 多字典：const { sys_notice_type, sys_common_status, loading } = useDict('sys_notice_type', 'sys_common_status');
 */
export function useDict<T extends string = string>(
  ...types: (T | T[])[]
): DictBundle & Record<T, DictBundle> & {
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const flattenedTypes = useMemo(() => {
    const list: string[] = [];
    for (const t of types) {
      if (Array.isArray(t)) {
        list.push(...t);
      } else if (typeof t === 'string' && t.trim()) {
        list.push(t.trim());
      }
    }
    return Array.from(new Set(list));
  }, [JSON.stringify(types)]);

  // 优先从 L1 / L2 获取初值，实现首屏 0ms 秒开无白屏
  const [dictState, setDictState] = useState<Record<string, SysDictDataItem[]>>(() => {
    const initial: Record<string, SysDictDataItem[]> = {};
    for (const t of flattenedTypes) {
      if (dictMemoryCache.has(t)) {
        initial[t] = dictMemoryCache.get(t)!.data;
      } else {
        const l2 = getFromL2(t);
        if (l2) {
          dictMemoryCache.set(t, { data: l2, expireAt: Date.now() + CACHE_TTL });
          initial[t] = l2;
        }
      }
    }
    return initial;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return flattenedTypes.some((t) => !dictMemoryCache.has(t) && !getFromL2(t));
  });

  const loadAll = useCallback(
    async (force = false) => {
      if (flattenedTypes.length === 0) {
        setLoading(false);
        return;
      }
      // 若已有缓存，且非强制刷新，则完全无需展示 loading（0ms 秒开）
      const hasAllCached = !force && flattenedTypes.every((t) => {
        const c = dictMemoryCache.get(t);
        return (c && Date.now() < c.expireAt) || !!getFromL2(t);
      });
      if (!hasAllCached) {
        setLoading(true);
      }
      try {
        const results = await Promise.all(
          flattenedTypes.map(async (t) => {
            const data = await fetchDictData(t, force);
            return { type: t, data };
          })
        );
        const newState: Record<string, SysDictDataItem[]> = {};
        for (const r of results) {
          newState[r.type] = r.data;
        }
        setDictState((prev) => ({ ...prev, ...newState }));
      } finally {
        setLoading(false);
      }
    },
    [flattenedTypes]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 自动订阅响应式字典事件（支持本地更新与跨 Tab 广播自动重绘）
  useEffect(() => {
    const unsubs = flattenedTypes.map((t) =>
      dictEventEmitter.subscribe(t, () => {
        loadAll(true);
      })
    );
    const unsubWildcard = dictEventEmitter.subscribe('*', () => {
      loadAll(true);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubWildcard();
    };
  }, [flattenedTypes, loadAll]);

  // 为每个 dictType 构建 DictBundle
  const bundles = useMemo(() => {
    const map: Record<string, DictBundle> = {};
    for (const t of flattenedTypes) {
      map[t] = buildDictBundle(dictState[t] || []);
    }
    return map;
  }, [flattenedTypes, dictState]);

  // 若仅请求了 1 个字典，将第一项也平铺在根对象上，极大增强消费体验
  const firstBundle = flattenedTypes.length > 0 && bundles[flattenedTypes[0]] ? bundles[flattenedTypes[0]] : emptyBundle;

  return {
    ...bundles,
    ...firstBundle,
    loading,
    refresh: () => loadAll(true),
  } as any;
}

/**
 * 清除指定字典或全局字典缓存并派发全站广播
 */
export function clearDictCache(dictType?: string, broadcast = true) {
  if (broadcast) {
    broadcastDictUpdate(dictType);
  } else {
    if (dictType) {
      dictMemoryCache.delete(dictType);
      removeFromL2(dictType);
    } else {
      dictMemoryCache.clear();
      removeFromL2();
    }
    dictEventEmitter.emit(dictType);
  }
}

