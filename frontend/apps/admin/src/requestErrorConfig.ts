import { ApiError, type RequestOptions, type RequestContext } from "@zero/api";

export enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

let appFeedback: {
  message?: any;
  notification?: any;
} = {};

export function setAppFeedback(feedback: { message?: any; notification?: any }) {
  appFeedback = feedback;
}

/**
 * 统一网络与业务错误处理器（对齐 Ant Design Pro 规范）
 */
export const errorHandler = (error: ApiError, context: RequestContext) => {
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
        message: "网络连接异常",
        description: "无法连接到微服务统一网关，请检查本地网络或网关服务是否运行 (8888)。",
      });
    } else if (msgApi) {
      msgApi.error("网络连接异常，无法访问网关服务");
    }
    return;
  }

  // 2. 认证失效 (401 或业务码 100003)，已由底层 handleUnauthorized 清理并跳转，静默处理
  if (status === 401 || status === 100003) {
    return;
  }

  // 3. 权限不足 (403)
  if (status === 403) {
    if (notifyApi) {
      notifyApi.warning({
        message: "访问受限 (403 Forbidden)",
        description: `您当前账号暂无此操作权限：[${context.method}] ${context.url}`,
      });
    } else if (msgApi) {
      msgApi.warning("无权限访问该资源");
    }
    return;
  }

  // 4. 服务端错误 (500, 502, 503, 504)
  if (status >= 500) {
    if (notifyApi) {
      notifyApi.error({
        message: "微服务后端调用异常",
        description: `服务返回状态码 ${status}：${errorText}`,
      });
    } else if (msgApi) {
      msgApi.error(`服务端异常 (${status})`);
    }
    return;
  }

  // 5. 普通业务异常 (如 400 参数错误或自定义业务错误码)
  if (msgApi) {
    msgApi.error(errorText);
  } else {
    console.error("[API Error]", error);
  }
};

export const requestErrorConfig = {
  errorHandler,
  requestInterceptors: [
    (url: string, options: RequestOptions) => {
      const headers = options.headers || {};
      headers["x-request-time"] = String(Date.now());
      return { url, options: { ...options, headers } };
    },
  ],
};

export default requestErrorConfig;
