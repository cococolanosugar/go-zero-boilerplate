export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiParamVO {
  name: string;
  in: "path" | "query" | "header" | "body";
  type: string;
  required?: boolean;
  description?: string;
  example?: any;
  default?: any;
}

export interface ApiEndpointVO {
  id: string; // 唯一标识, 如 "titan-create-project"
  tag: string; // 业务分组名称, 如 "Titan 研发交付"
  tagKey: string; // 分组编码, 如 "titan"
  name: string; // 接口中文名称/摘要, 如 "创建项目空间"
  method: HttpMethod;
  path: string; // 路由路径, 如 "/api/v1/titan/projects"
  description?: string; // 详细契约描述
  authRequired?: boolean; // 是否需要 JWT 鉴权
  parameters?: ApiParamVO[]; // 请求参数列表
  requestBodyExample?: Record<string, any>; // 请求体样例
  responseExample?: Record<string, any>; // 成功响应样例
  sdkMethod?: string; // 映射的 @zero/api SDK 方法名, 如 "titanCreateProject"
}

export interface ApiCategoryVO {
  key: string;
  title: string;
  icon?: string;
  description?: string;
  endpoints: ApiEndpointVO[];
}

export interface SandboxResult {
  loading: boolean;
  status?: number;
  statusText?: string;
  latencyMs?: number;
  headers?: Record<string, string>;
  data?: any;
  error?: boolean;
  errorMessage?: string;
  requestedAt?: string;
  curlCommand?: string;
}

export type SupportedLanguage = "curl" | "typescript" | "go" | "python";
