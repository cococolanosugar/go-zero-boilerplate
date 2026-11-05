import type { ApiEndpointVO, SupportedLanguage } from "./types";

interface CodeGenOptions {
  endpoint: ApiEndpointVO;
  params: Record<string, any>;
  body: any;
  headers: Record<string, string>;
  host?: string;
}

/**
 * 组装真实请求 URL (处理动态 Path 参数与 Query 参数)
 */
export function buildResolvedUrl(endpoint: ApiEndpointVO, params: Record<string, any>, host: string = "localhost:8888"): {
  fullUrl: string;
  pathWithParams: string;
} {
  let resolvedPath = endpoint.path;

  // 1. 替换路径参数 :param 或 {param}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      resolvedPath = resolvedPath.replace(new RegExp(`:${key}\\b`, "g"), String(val));
      resolvedPath = resolvedPath.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    }
  });

  // 2. 组装 Query 参数
  const queryParams: string[] = [];
  endpoint.parameters?.forEach((p) => {
    if (p.in === "query") {
      const val = params[p.name];
      if (val !== undefined && val !== null && val !== "") {
        queryParams.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(String(val))}`);
      }
    }
  });

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  const pathWithParams = `${resolvedPath}${queryString}`;
  const fullUrl = `http://${host}${pathWithParams}`;

  return { fullUrl, pathWithParams };
}

/**
 * 生成 cURL 调用命令
 */
export function generateCurl(options: CodeGenOptions): string {
  const { endpoint, params, body, headers, host = "localhost:8888" } = options;
  const { fullUrl } = buildResolvedUrl(endpoint, params, host);

  const lines: string[] = [`curl -X ${endpoint.method} "${fullUrl}"`];

  // Headers
  Object.entries(headers).forEach(([k, v]) => {
    if (v) lines.push(`  -H "${k}: ${v}"`);
  });

  // Body
  if ((endpoint.method === "POST" || endpoint.method === "PUT" || endpoint.method === "PATCH") && body) {
    const jsonStr = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${jsonStr}'`);
  }

  return lines.join(" \\\n");
}

/**
 * 生成 TypeScript (@zero/api) SDK 调用代码
 */
export function generateTypeScript(options: CodeGenOptions): string {
  const { endpoint, params, body } = options;
  const sdkFn = endpoint.sdkMethod;

  if (sdkFn) {
    const hasBody = (endpoint.method === "POST" || endpoint.method === "PUT") && body;
    const bodyStr = hasBody ? JSON.stringify(body, null, 2) : "";
    const hasQuery = Object.keys(params).length > 0;
    const queryStr = hasQuery ? JSON.stringify(params, null, 2) : "";

    let callArgs = "";
    if (hasQuery && hasBody) {
      callArgs = `${queryStr}, ${bodyStr}`;
    } else if (hasBody) {
      callArgs = bodyStr;
    } else if (hasQuery) {
      callArgs = queryStr;
    }

    return `import { ${sdkFn} } from '@zero/api';

async function run() {
  try {
    const response = await ${sdkFn}(${callArgs});
    console.log('响应结果:', response);
  } catch (error) {
    console.error('调用异常:', error);
  }
}

run();`;
  }

  // 通用 request 模板
  const { pathWithParams } = buildResolvedUrl(endpoint, params);
  const dataBlock =
    (endpoint.method === "POST" || endpoint.method === "PUT") && body
      ? `\n  data: ${JSON.stringify(body, null, 2)},`
      : "";

  return `import { request } from '@zero/api';

async function run() {
  const res = await request('${pathWithParams}', {
    method: '${endpoint.method}',${dataBlock}
  });
  console.log(res);
}

run();`;
}

/**
 * 生成 Go 原生 HTTP / go-zero 客户端调用代码
 */
export function generateGo(options: CodeGenOptions): string {
  const { endpoint, params, body, headers, host = "localhost:8888" } = options;
  const { fullUrl } = buildResolvedUrl(endpoint, params, host);
  const hasBody = (endpoint.method === "POST" || endpoint.method === "PUT") && body;
  const bodyJson = hasBody ? JSON.stringify(body) : "";

  return `package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
${hasBody ? '\t"strings"\n' : ""}
)

func main() {
	ctx := context.Background()
	url := "${fullUrl}"

${hasBody ? `\tpayload := strings.NewReader(\`${bodyJson}\`)\n\treq, err := http.NewRequestWithContext(ctx, "${endpoint.method}", url, payload)` : `\treq, err := http.NewRequestWithContext(ctx, "${endpoint.method}", url, nil)`}
	if err != nil {
		panic(err)
	}

${hasBody ? '\treq.Header.Set("Content-Type", "application/json")\n' : ""}${headers.Authorization ? `\treq.Header.Set("Authorization", "${headers.Authorization}")\n` : ""}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Printf("HTTP Status: %d\\nResponse: %s\\n", resp.StatusCode, string(bodyBytes))
}`;
}

/**
 * 生成 Python requests 客户端调用代码
 */
export function generatePython(options: CodeGenOptions): string {
  const { endpoint, params, body, headers, host = "localhost:8888" } = options;
  const { fullUrl } = buildResolvedUrl(endpoint, params, host);
  const hasBody = (endpoint.method === "POST" || endpoint.method === "PUT") && body;

  const headerLines = Object.entries(headers)
    .filter(([_, v]) => Boolean(v))
    .map(([k, v]) => `    "${k}": "${v}",`)
    .join("\n");

  return `import requests

url = "${fullUrl}"
headers = {
${headerLines}
${hasBody ? '    "Content-Type": "application/json",' : ""}
}
${hasBody ? `payload = ${JSON.stringify(body, null, 4)}\n` : ""}
response = requests.${endpoint.method.toLowerCase()}(
    url,
    headers=headers,
${hasBody ? "    json=payload," : ""}
    timeout=10
)

print(f"Status: {response.status_code}")
print(response.json() if response.headers.get("content-type") == "application/json" else response.text)
`;
}

/**
 * 语言分发器
 */
export function generateCodeSnippet(language: SupportedLanguage, options: CodeGenOptions): string {
  switch (language) {
    case "curl":
      return generateCurl(options);
    case "typescript":
      return generateTypeScript(options);
    case "go":
      return generateGo(options);
    case "python":
      return generatePython(options);
    default:
      return generateCurl(options);
  }
}
