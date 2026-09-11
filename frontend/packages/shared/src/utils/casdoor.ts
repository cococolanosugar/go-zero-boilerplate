export interface CasdoorAuthConfig {
  endpoint: string;
  clientId: string;
  appName: string;
  orgName: string;
  redirectUri: string;
}

export const DEFAULT_CASDOOR_CONFIG: Omit<CasdoorAuthConfig, "redirectUri"> = {
  endpoint: "http://192.168.31.174:8000",
  clientId: "d795c3b1a7b960bd0b61",
  appName: "app-built-in",
  orgName: "built-in",
};

/**
 * 获取当前环境推荐的 Casdoor Endpoint。
 * 优先采用局域网内网 IP http://192.168.31.174:8000。
 * 若当前页面处于浏览器非 localhost 域名环境下，自动匹配当前主机名的 8000 端口。
 */
export function getRecommendedCasdoorEndpoint(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `${window.location.protocol}//${host}:8000`;
    }
  }
  return DEFAULT_CASDOOR_CONFIG.endpoint;
}

/**
 * 构造 Casdoor OAuth 2.0 / OIDC 统一授权登录跳转 URL
 */
export function buildCasdoorAuthUrl(
  config: Partial<CasdoorAuthConfig> & { redirectUri: string },
  state?: string
): string {
  const defaultEndpoint = getRecommendedCasdoorEndpoint();
  const endpoint = (config.endpoint || defaultEndpoint).replace(/\/+$/, "");
  const clientId = config.clientId || DEFAULT_CASDOOR_CONFIG.clientId;
  const cleanState = state || Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: "read",
    state: cleanState,
  });

  return `${endpoint}/login/oauth/authorize?${params.toString()}`;
}

/**
 * 从浏览器回调 URL search 参数中解析授权码 code 与防 CSRF state
 */
export function parseCasdoorCallback(search: string): {
  code: string | null;
  state: string | null;
} {
  const params = new URLSearchParams(search);
  return {
    code: params.get("code"),
    state: params.get("state"),
  };
}
