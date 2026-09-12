/**
 * Ant Design ProTable 专用请求适配器
 * 自动适配 go-zero 统一分页参数与响应结构
 */

export interface ProTableRequestData<T> {
  data: T[];
  success: boolean;
  total: number;
  [key: string]: any;
}

export type ProTableApiFunction<TItem, TReq = any> = (
  params: TReq,
  config?: any
) => Promise<{ list?: TItem[]; total?: number } | any>;

export interface ProTableAdapterOptions<TReq = any> {
  /** 自定义请求参数转换逻辑 */
  transformParams?: (params: Record<string, any>, sort: any, filter: any) => TReq;
  /** 自定义结果转换逻辑 */
  transformResponse?: (res: any) => { data: any[]; total: number };
  /** 启用防竞态自动取消：连续触发请求时自动 abort 上一个挂起请求，默认 true */
  autoAbort?: boolean;
}

/**
 * 将 go-zero 领域 API 接口包装为 ProTable 原生期望的 request 函数
 *
 * @example
 * <ProTable<SysUserItem>
 *   request={toProTableRequest(systemUsersApi.list)}
 * />
 */
export function toProTableRequest<TItem = any, TReq = any>(
  apiFn: ProTableApiFunction<TItem, TReq>,
  options?: ProTableAdapterOptions<TReq>
) {
  let activeController: AbortController | null = null;

  return async (
    params: Record<string, any>,
    sort: Record<string, any> = {},
    filter: Record<string, any> = {}
  ): Promise<ProTableRequestData<TItem>> => {
    if (options?.autoAbort !== false) {
      if (activeController) {
        activeController.abort();
      }
      activeController = new AbortController();
    }

    const { current, pageSize, ...rest } = params;

    // 清洗掉空字符串或 undefined 过滤项
    const cleanedParams: Record<string, any> = {};
    for (const [key, val] of Object.entries(rest)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanedParams[key] = val;
      }
    }

    let finalParams: any = {
      page: current || 1,
      pageSize: pageSize || 10,
      ...cleanedParams,
    };

    if (options?.transformParams) {
      finalParams = options.transformParams(params, sort, filter);
    }

    try {
      const res = await apiFn(finalParams, { signal: activeController?.signal });

      if (options?.transformResponse) {
        const customData = options.transformResponse(res);
        return {
          data: customData.data || [],
          total: customData.total || 0,
          success: true,
        };
      }

      return {
        data: res?.list || res?.data || [],
        total: res?.total || (res?.list ? res.list.length : 0),
        success: true,
      };
    } catch (err: any) {
      if (err?.code === -2 || err?.name === "AbortError") {
        return {
          data: [],
          total: 0,
          success: false,
        };
      }
      throw err;
    }
  };
}

/**
 * 通用文件上传方法，自动包装 FormData 并调用 /api/v1/system/file/upload
 * @param file File 实例或包含 file 字段的 FormData
 */
export async function uploadSingleFile(
  file: any,
  options?: any
): Promise<any> {
  const { webapi } = await import('./gocliRequest');
  let formData: any;
  if (typeof FormData !== 'undefined' && file instanceof FormData) {
    formData = file;
  } else {
    formData = new FormData();
    formData.append('file', file);
  }
  return webapi.post('/api/v1/system/file/upload', formData, options);
}
