import { useState, useEffect, useCallback } from "react";
import { getDictDataByType, type SysDictDataItem } from "@zero/api";

export interface DictOption {
  label: string;
  value: string;
  listClass?: string;
  raw: SysDictDataItem;
}

export type ProTableValueEnum = Record<
  string,
  {
    text: string;
    status?: "Success" | "Error" | "Default" | "Processing" | "Warning";
    color?: string;
  }
>;

// 简单的客户端内存字典缓存，避免频繁切页重复发起网络请求
const dictMemoryCache = new Map<string, SysDictDataItem[]>();

export function useDict(dictType: string) {
  const [data, setData] = useState<SysDictDataItem[]>(
    () => dictMemoryCache.get(dictType) || []
  );
  const [loading, setLoading] = useState<boolean>(!dictMemoryCache.has(dictType));

  const fetchDict = useCallback(
    async (force = false) => {
      if (!dictType) return;
      if (!force && dictMemoryCache.has(dictType)) {
        setData(dictMemoryCache.get(dictType)!);
        return;
      }
      try {
        setLoading(true);
        const res = await getDictDataByType({}, dictType);
        const list = res.list || [];
        dictMemoryCache.set(dictType, list);
        setData(list);
      } catch (err) {
        console.error(`加载字典 [${dictType}] 失败:`, err);
      } finally {
        setLoading(false);
      }
    },
    [dictType]
  );

  useEffect(() => {
    fetchDict();
  }, [fetchDict]);

  // 转为 ProFormSelect / Select 的 options 格式
  const options: DictOption[] = data.map((item) => ({
    label: item.dictLabel,
    value: item.dictValue,
    listClass: item.listClass,
    raw: item,
  }));

  // 转为 ProTable columns valueEnum 格式
  const valueEnum: ProTableValueEnum = data.reduce((acc, item) => {
    const listClass = item.listClass?.toLowerCase() || "";
    let status:
      | "Success"
      | "Error"
      | "Default"
      | "Processing"
      | "Warning"
      | undefined;
    let color: string | undefined;

    if (listClass === "success") status = "Success";
    else if (listClass === "error" || listClass === "danger") status = "Error";
    else if (listClass === "warning") status = "Warning";
    else if (listClass === "processing" || listClass === "primary")
      status = "Processing";
    else if (listClass === "default") status = "Default";
    else if (listClass) color = listClass;

    acc[item.dictValue] = {
      text: item.dictLabel,
      ...(status ? { status } : {}),
      ...(color ? { color } : {}),
    };
    return acc;
  }, {} as ProTableValueEnum);

  return {
    data,
    options,
    valueEnum,
    loading,
    refresh: () => fetchDict(true),
  };
}

export function clearDictCache(dictType?: string) {
  if (dictType) {
    dictMemoryCache.delete(dictType);
  } else {
    dictMemoryCache.clear();
  }
}
