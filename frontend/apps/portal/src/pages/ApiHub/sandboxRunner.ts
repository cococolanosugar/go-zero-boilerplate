import type { ApiEndpointVO, SandboxResult } from "./types";
import { buildResolvedUrl, generateCurl } from "./codeGenerator";

export interface SandboxExecuteOptions {
  endpoint: ApiEndpointVO;
  params: Record<string, any>;
  body: any;
  token?: string;
  customHeaders?: Record<string, string>;
  host?: string;
}

/**
 * 沙箱请求执行器：向统一网关发送真实调试请求，自动注入鉴权，并精准捕获状态码、网络延迟与错误结构
 */
export async function executeSandboxRequest(options: SandboxExecuteOptions): Promise<SandboxResult> {
  const { endpoint, params, body, token, customHeaders = {}, host = "localhost:8888" } = options;
  const { fullUrl } = buildResolvedUrl(endpoint, params, host);

  // 组装请求头
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const hasBody = (endpoint.method === "POST" || endpoint.method === "PUT" || endpoint.method === "PATCH") && body;
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  // 生成对应的 cURL 命令
  const curlCommand = generateCurl({ endpoint, params, body, headers, host });

  const start = performance.now();
  const requestedAt = new Date().toLocaleTimeString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒请求超时保护

    const response = await fetch(fullUrl, {
      method: endpoint.method,
      headers,
      body: hasBody ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const end = performance.now();
    const latencyMs = Math.round(end - start);

    // 提取响应头
    const respHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      respHeaders[key] = val;
    });

    // 解析响应体 (优先尝试 JSON)
    const contentType = response.headers.get("content-type") || "";
    let data: any = null;
    if (contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => "");
    }

    const isOk = response.ok;

    return {
      loading: false,
      status: response.status,
      statusText: response.statusText,
      latencyMs,
      headers: respHeaders,
      data,
      error: !isOk,
      errorMessage: !isOk ? (data?.msg || data?.message || `HTTP 错误: ${response.status} ${response.statusText}`) : undefined,
      requestedAt,
      curlCommand,
    };
  } catch (err: any) {
    const end = performance.now();
    const latencyMs = Math.round(end - start);

    const isAbort = err.name === "AbortError";
    const errorMessage = isAbort
      ? "请求超时 (超过 15 秒未响应)"
      : (err?.message || "网络请求失败，请检查网关服务 (:8888) 是否正常运行");

    return {
      loading: false,
      status: 0,
      statusText: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      latencyMs,
      error: true,
      errorMessage,
      requestedAt,
      curlCommand,
      data: {
        error: true,
        message: errorMessage,
        tip: "统一网关运行在端口 :8888，请确认网关进程已启动并且未被防火墙阻断。",
      },
    };
  }
}
