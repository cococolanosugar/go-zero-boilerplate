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
  params: TReq
) => Promise<{ list?: TItem[]; total?: number } | any>;

export interface ProTableAdapterOptions<TReq = any> {
  /** 自定义请求参数转换逻辑 */
  transformParams?: (params: Record<string, any>, sort: any, filter: any) => TReq;
  /** 自定义结果转换逻辑 */
  transformResponse?: (res: any) => { data: any[]; total: number };
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
  return async (
    params: Record<string, any>,
    sort: Record<string, any> = {},
    filter: Record<string, any> = {}
  ): Promise<ProTableRequestData<TItem>> => {
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

    const res = await apiFn(finalParams);

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
  };
}
