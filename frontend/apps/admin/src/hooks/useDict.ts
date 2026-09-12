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

const CACHE_TTL = 10 * 60 * 1000; // 10 分钟缓存
const dictMemoryCache = new Map<string, { data: SysDictDataItem[]; expireAt: number }>();
const inFlightPromises = new Map<string, Promise<SysDictDataItem[]>>();

/**
 * 底层字典数据加载与防竞态去重拉取器
 */
async function fetchDictData(dictType: string, force = false): Promise<SysDictDataItem[]> {
  if (!dictType) return [];

  // 1. 缓存有效则优先命中
  if (!force && dictMemoryCache.has(dictType)) {
    const cached = dictMemoryCache.get(dictType)!;
    if (Date.now() < cached.expireAt) {
      return cached.data;
    }
  }

  // 2. 避免并发重复请求（In-Flight Deduplication）
  if (inFlightPromises.has(dictType)) {
    return inFlightPromises.get(dictType)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await getDictDataByType({}, dictType);
      const list = res?.list || [];
      dictMemoryCache.set(dictType, { data: list, expireAt: Date.now() + CACHE_TTL });
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
 * 支持单字典或多字典加载：
 * 1. 单字典：const { options, valueEnum, getLabel } = useDict('sys_common_status');
 * 2. 多字典：const { sys_notice_type, sys_common_status, loading } = useDict('sys_notice_type', 'sys_common_status');
 */
export function useDict(...types: (string | string[])[]) {
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

  const [dictState, setDictState] = useState<Record<string, SysDictDataItem[]>>(() => {
    const initial: Record<string, SysDictDataItem[]> = {};
    for (const t of flattenedTypes) {
      if (dictMemoryCache.has(t)) {
        initial[t] = dictMemoryCache.get(t)!.data;
      }
    }
    return initial;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return flattenedTypes.some((t) => !dictMemoryCache.has(t));
  });

  const loadAll = useCallback(
    async (force = false) => {
      if (flattenedTypes.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
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
  };
}

/**
 * 清除指定字典或全局字典缓存
 */
export function clearDictCache(dictType?: string) {
  if (dictType) {
    dictMemoryCache.delete(dictType);
  } else {
    dictMemoryCache.clear();
  }
}
