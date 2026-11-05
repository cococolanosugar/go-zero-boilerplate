import type { ApiCategoryVO, ApiEndpointVO, HttpMethod, ApiParamVO } from "./types";
import { BUILTIN_API_CATEGORIES } from "./manifest";

/**
 * 契约加载器：优先动态探测统一网关的 OpenAPI / Swagger 规范定义，
 * 若网关未启动或跨域异常，则秒级无缝降级至内置契约清单，保证 100% 高可用。
 */
export async function loadApiCategories(): Promise<{ categories: ApiCategoryVO[]; isLive: boolean }> {
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时快速探测

    // 优先尝试探测网关暴露的 openapi/swagger 端点
    const response = await fetch(`http://${host}:8888/openapi`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const swaggerJson = await response.json().catch(() => null);
      if (swaggerJson && swaggerJson.paths) {
        const liveCategories = parseSwaggerToCategories(swaggerJson);
        if (liveCategories.length > 0) {
          return { categories: liveCategories, isLive: true };
        }
      }
    }
  } catch {
    // 忽略异常，平滑降级
  }

  // 离线/兜底清单
  return { categories: BUILTIN_API_CATEGORIES, isLive: false };
}

/**
 * 将 Swagger/OpenAPI 规范文档映射为结构化树形数据
 */
function parseSwaggerToCategories(swagger: any): ApiCategoryVO[] {
  const categoryMap = new Map<string, ApiEndpointVO[]>();
  const paths = swagger.paths || {};

  for (const [pathKey, pathItem] of Object.entries<any>(paths)) {
    for (const method of ["get", "post", "put", "delete", "patch"] as const) {
      const op = pathItem[method];
      if (!op) continue;

      const upperMethod = method.toUpperCase() as HttpMethod;
      const tag = op.tags?.[0] || "通用接口";
      const tagKey = tag.toLowerCase().replace(/[^a-z0-9]/g, "-") || "common";
      const summary = op.summary || op.description || `${upperMethod} ${pathKey}`;
      const id = op.operationId || `${method}-${pathKey.replace(/[^a-zA-Z0-9]/g, "-")}`;

      const parameters: ApiParamVO[] = (op.parameters || []).map((p: any) => ({
        name: p.name,
        in: p.in,
        type: p.type || p.schema?.type || "string",
        required: p.required || false,
        description: p.description,
        example: p.example || p.schema?.example,
        default: p.default || p.schema?.default,
      }));

      // 推断 SDK 方法名
      const sdkMethod = op.operationId || undefined;

      const endpoint: ApiEndpointVO = {
        id,
        tag,
        tagKey,
        name: summary,
        method: upperMethod,
        path: pathKey,
        description: op.description || summary,
        authRequired: Boolean(op.security && op.security.length > 0),
        parameters,
        requestBodyExample: op.requestBody?.content?.["application/json"]?.example,
        responseExample: op.responses?.["200"]?.content?.["application/json"]?.example,
        sdkMethod,
      };

      if (!categoryMap.has(tag)) {
        categoryMap.set(tag, []);
      }
      categoryMap.get(tag)!.push(endpoint);
    }
  }

  return Array.from(categoryMap.entries()).map(([title, endpoints]) => ({
    key: endpoints[0]?.tagKey || title.toLowerCase(),
    title,
    endpoints,
  }));
}

/**
 * 实时过滤检索
 */
export function filterCategories(
  categories: ApiCategoryVO[],
  keyword: string,
  methodFilter?: string
): ApiCategoryVO[] {
  const kw = keyword.trim().toLowerCase();
  const mf = methodFilter?.toUpperCase();

  if (!kw && (!mf || mf === "ALL")) {
    return categories;
  }

  return categories
    .map((cat) => {
      const matched = cat.endpoints.filter((ep) => {
        const matchesMethod = !mf || mf === "ALL" || ep.method === mf;
        const matchesKw =
          !kw ||
          ep.path.toLowerCase().includes(kw) ||
          ep.name.toLowerCase().includes(kw) ||
          ep.tag.toLowerCase().includes(kw) ||
          (ep.description && ep.description.toLowerCase().includes(kw));

        return matchesMethod && matchesKw;
      });

      return {
        ...cat,
        endpoints: matched,
      };
    })
    .filter((cat) => cat.endpoints.length > 0);
}

/**
 * 根据 ID 快速检索接口
 */
export function findEndpointById(categories: ApiCategoryVO[], id: string): ApiEndpointVO | undefined {
  for (const cat of categories) {
    const found = cat.endpoints.find((ep) => ep.id === id);
    if (found) return found;
  }
  return undefined;
}
