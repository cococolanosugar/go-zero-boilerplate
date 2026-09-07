import { ApiError, type RequestOptions, type RequestContext } from "@zero/api";

let appFeedback: {
  message?: any;
  notification?: any;
} = {};

export function setPortalAppFeedback(feedback: { message?: any; notification?: any }) {
  appFeedback = feedback;
}

/**
 * 门户端统一网络与业务错误处理器（对齐 Ant Design Pro 规范）
 */
export const portalErrorHandler = (error: ApiError, context: RequestContext) => {
  if (context.options?.skipErrorHandler) {
    return;
  }

  const { message: msgApi, notification: notifyApi } = appFeedback;
  const status = error.code;
  const errorText = error.message || "请求发生未知错误";

  // 1. 网络离线或超时
  if (status === -1) {
    if (notifyApi) {
      notifyApi.error({
        message: "网络连接失败",
        description: "无法连接到门户后端网关，请检查网络或网关服务是否开启。",
      });
    } else if (msgApi) {
      msgApi.error("网络连接失败，请稍后重试");
    }
    return;
  }

  // 2. 认证失效 (401 或业务码 100003)
  if (status === 401 || status === 100003) {
    return;
  }

  // 3. 权限不足 (403)
  if (status === 403) {
    if (msgApi) {
      msgApi.warning("暂无访问权限");
    }
    return;
  }

  // 4. 服务端错误 (500+)
  if (status >= 500) {
    if (msgApi) {
      msgApi.error(`系统繁忙，请稍后重试 (${status})`);
    } else {
      console.error("[Portal API Error]", error);
    }
    return;
  }

  // 5. 普通业务异常
  if (msgApi) {
    msgApi.error(errorText);
  } else {
    console.error("[Portal API Error]", error);
  }
};

export const portalRequestErrorConfig = {
  errorHandler: portalErrorHandler,
  requestInterceptors: [
    (url: string, options: RequestOptions) => {
      const headers = options.headers || {};
      headers["x-request-time"] = String(Date.now());
      return { url, options: { ...options, headers } };
    },
  ],
};

export default portalRequestErrorConfig;
