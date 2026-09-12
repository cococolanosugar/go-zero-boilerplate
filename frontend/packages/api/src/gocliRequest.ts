export type Method =
    | 'get'
    | 'GET'
    | 'delete'
    | 'DELETE'
    | 'head'
    | 'HEAD'
    | 'options'
    | 'OPTIONS'
    | 'post'
    | 'POST'
    | 'put'
    | 'PUT'
    | 'patch'
    | 'PATCH';

/**
 * Parse route parameters for responseType
 */
const reg = /:[a-z|A-Z]+/g;

export function parseParams(url: string): Array<string> {
    const ps = url.match(reg);
    if (!ps) {
        return [];
    }
    return ps.map((k) => k.replace(/:/, ''));
}

/**
 * Generate url and parameters
 * @param url
 * @param params
 */
export function genUrl(url: string, params: any) {
    if (!params) {
        return url;
    }

    const ps = parseParams(url);
    ps.forEach((k) => {
        const reg = new RegExp(`:${k}`);
        url = url.replace(reg, params[k]);
    });

    const path: Array<string> = [];
    for (const key of Object.keys(params)) {
        if (!ps.find((k) => k === key)) {
            const val = params[key];
            if (val !== undefined && val !== null && val !== '') {
                path.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
            }
        }
    }

    const search = path.length > 0 ? (url.includes('?') ? '&' : '?') + path.join('&') : '';
    return url + search;
}

export class ApiError extends Error {
    code: number;
    data?: any;
    handled?: boolean;

    constructor(code: number, message: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.data = data;
        this.handled = false;
    }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
    skipErrorHandler?: boolean;
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
    timeout?: number;
    /** 显式指定客户端幂等唯一 Key */
    idempotencyKey?: string;
    /** 是否开启客户端在途并发防重 (默认对 POST, PUT, PATCH, DELETE 开启) */
    preventDuplicate?: boolean;
    /** 防重复提交窗口时间 (毫秒)，默认 3000 */
    duplicateInterval?: number;
    [key: string]: any;
}

export interface RequestContext {
    url: string;
    method: string;
    options: RequestOptions;
    data?: any;
}

export type RequestInterceptor = (
    url: string,
    options: RequestOptions
) => { url?: string; options?: RequestOptions } | Promise<{ url?: string; options?: RequestOptions }> | void | Promise<void>;

export type ResponseInterceptor = (
    response: Response,
    context: RequestContext
) => Response | Promise<Response> | void | Promise<void>;

export type ErrorHandler = (error: ApiError, context: RequestContext) => void | Promise<void>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
let globalErrorHandler: ErrorHandler | null = null;

// 客户端在途请求并发与防重状态记录
interface PendingRequestItem {
    timestamp: number;
}
const pendingRequests = new Map<string, PendingRequestItem>();

/**
 * 清除所有客户端在途防重锁（用于测试或全局状态重置）
 */
export function clearPendingRequests() {
    pendingRequests.clear();
}

export function addRequestInterceptor(interceptor: RequestInterceptor) {
    requestInterceptors.push(interceptor);
    return () => {
        const index = requestInterceptors.indexOf(interceptor);
        if (index > -1) requestInterceptors.splice(index, 1);
    };
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
    responseInterceptors.push(interceptor);
    return () => {
        const index = responseInterceptors.indexOf(interceptor);
        if (index > -1) responseInterceptors.splice(index, 1);
    };
}

export function setErrorHandler(handler: ErrorHandler | null) {
    globalErrorHandler = handler;
}

let authToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export function setToken(token: string | null) {
    authToken = token;
    if (typeof localStorage !== 'undefined') {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
            try {
                localStorage.setItem('zero_session_sync_channel', JSON.stringify({
                    type: 'AUTH_LOGOUT',
                    timestamp: Date.now()
                }));
            } catch (_) {}
        }
    }
}

export function getToken(): string | null {
    if (authToken) return authToken;
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
}

export function handleUnauthorized() {
    setToken(null);
    if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
            const redirectUrl = `/login?from=${encodeURIComponent(currentPath + window.location.search)}`;
            window.location.href = redirectUrl;
        }
    }
}

export async function request({
    method,
    url: initialUrl,
    data,
    config = {}
}: {
    method: Method;
    url: string;
    data?: unknown;
    config?: RequestOptions;
}) {
    let url = initialUrl;
    let options: RequestOptions = {
        credentials: 'include',
        ...config,
    };

    const upperMethod = method.toLocaleUpperCase();
    const isGetOrHead = upperMethod === 'GET' || upperMethod === 'HEAD';

    const token = getToken();
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
    };
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    options.method = upperMethod;
    options.headers = headers;
    if (!isGetOrHead && data !== undefined) {
        if (isFormData) {
            options.body = data as any;
        } else {
            options.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
    }

    if (options.idempotencyKey && !headers['X-Idempotency-Key']) {
        headers['X-Idempotency-Key'] = options.idempotencyKey;
    }
    if (options.duplicateInterval && !headers['X-Repeat-Submit-Interval']) {
        headers['X-Repeat-Submit-Interval'] = String(Math.round(options.duplicateInterval / 1000));
    }

    // Execute Request Interceptors
    for (const interceptor of requestInterceptors) {
        const res = await interceptor(url, options);
        if (res) {
            if (res.url) url = res.url;
            if (res.options) options = res.options;
        }
    }

    const context: RequestContext = { url, method: upperMethod, options, data };

    // 客户端并发防重与防抖拦截（针对写请求 POST/PUT/PATCH/DELETE）
    const isMutating = upperMethod === 'POST' || upperMethod === 'PUT' || upperMethod === 'PATCH' || upperMethod === 'DELETE';
    const enableAntiRepeat = isMutating && !isFormData && options.preventDuplicate !== false;
    let pendingKey = '';

    if (enableAntiRepeat) {
        const bodyStr = typeof options.body === 'string' ? options.body : '';
        pendingKey = `${upperMethod}:${url}:${options.idempotencyKey || bodyStr}`;
        const existing = pendingRequests.get(pendingKey);
        const interval = options.duplicateInterval || 3000;
        if (existing) {
            const timeDiff = Date.now() - existing.timestamp;
            if (timeDiff < interval) {
                const repeatErr = new ApiError(100008, '请求正在处理中或请勿频繁重复提交，请稍后再试');
                if (globalErrorHandler && !options.skipErrorHandler) {
                    try {
                        await globalErrorHandler(repeatErr, context);
                        repeatErr.handled = true;
                    } catch (_) {}
                }
                throw repeatErr;
            }
        }
        pendingRequests.set(pendingKey, { timestamp: Date.now() });
    }

    const callerSignal = options.signal;
    const timeoutMs = options.timeout !== undefined ? options.timeout : 30000;
    let timeoutTimer: any = null;
    let timedOut = false;
    let controller: AbortController | null = null;

    if (timeoutMs > 0 || callerSignal) {
        controller = new AbortController();

        if (callerSignal) {
            if (callerSignal.aborted) {
                controller.abort(callerSignal.reason);
            } else {
                callerSignal.addEventListener('abort', () => {
                    controller?.abort(callerSignal.reason);
                }, { once: true });
            }
        }

        if (timeoutMs > 0) {
            timeoutTimer = setTimeout(() => {
                timedOut = true;
                controller?.abort('timeout');
            }, timeoutMs);
        }

        options.signal = controller.signal;
    }

    let response: Response;
    try {
        response = await fetch(url, options);
    } catch (networkErr: any) {
        if (timedOut) {
            const timeoutError = new ApiError(-3, '请求超时，请检查网络', networkErr);
            if (globalErrorHandler && !options.skipErrorHandler) {
                try {
                    await globalErrorHandler(timeoutError, context);
                    timeoutError.handled = true;
                } catch (_) {}
            }
            throw timeoutError;
        }

        // 主动取消的请求（AbortController.abort()），静默向上抛出，不触发全局错误提示
        if (networkErr?.name === 'AbortError' || networkErr?.code === 20 || callerSignal?.aborted) {
            const abortError = new ApiError(-2, '请求已主动取消', networkErr);
            abortError.handled = true;
            throw abortError;
        }

        const apiError = new ApiError(-1, networkErr.message || '网络连接异常或服务未启动', networkErr);
        if (globalErrorHandler && !options.skipErrorHandler) {
            try {
                await globalErrorHandler(apiError, context);
                apiError.handled = true;
            } catch (_) {}
        }
        throw apiError;
    } finally {
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
        }
        if (pendingKey) {
            const cleanupInterval = options.duplicateInterval || 3000;
            setTimeout(() => {
                pendingRequests.delete(pendingKey);
            }, cleanupInterval);
        }
    }

    // Execute Response Interceptors
    for (const interceptor of responseInterceptors) {
        const modifiedResp = await interceptor(response, context);
        if (modifiedResp) response = modifiedResp;
    }

    if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        let errorCode = response.status;
        try {
            const errJson = await response.json();
            if (errJson && typeof errJson === 'object') {
                errorCode = errJson.code || response.status;
                errorMsg = errJson.msg || errorMsg;
            }
        } catch (_) {}

        // 核心安全拦截：HTTP 401 或 Token 过期自动清空凭证并重定向登录
        if (response.status === 401 || errorCode === 100003) {
            handleUnauthorized();
        }

        const apiError = new ApiError(errorCode, errorMsg);
        if (globalErrorHandler && !options.skipErrorHandler) {
            try {
                await globalErrorHandler(apiError, context);
                apiError.handled = true;
            } catch (_) {}
        }

        throw apiError;
    }

    const res = await response.json();

    // 核心自动解包：匹配后端统一响应结构 { code: 200, msg: "SUCCESS", data: ... }
    if (res && typeof res === 'object' && 'code' in res) {
        if (res.code === 200 || res.code === 0) {
            return res.data;
        }
        if (res.code === 100003) {
            handleUnauthorized();
        }
        const apiError = new ApiError(res.code, res.msg || `Request failed with code ${res.code}`, res.data);
        if (globalErrorHandler && !options.skipErrorHandler) {
            try {
                await globalErrorHandler(apiError, context);
                apiError.handled = true;
            } catch (_) {}
        }
        throw apiError;
    }

    return res;
}

function api<T>(
    method: Method = 'get',
    url: string,
    req?: any,
    config?: RequestOptions
): Promise<T> {
    if (url.match(/:/) || method.match(/get|delete/i)) {
        const queryParams = req ? (req.params || req.forms || req) : undefined;
        url = genUrl(url, queryParams);
    }
    method = method.toLocaleLowerCase() as Method;

    return request({ method, url, data: req, config });
}

export const webapi = {
    get<T>(url: string, req?: unknown, config?: RequestOptions): Promise<T> {
        return api<T>('get', url, req, config);
    },
    delete<T>(url: string, req?: unknown, config?: RequestOptions): Promise<T> {
        return api<T>('delete', url, req, config);
    },
    put<T>(url: string, req?: unknown, config?: RequestOptions): Promise<T> {
        return api<T>('put', url, req, config);
    },
    post<T>(url: string, req?: unknown, config?: RequestOptions): Promise<T> {
        return api<T>('post', url, req, config);
    },
    patch<T>(url: string, req?: unknown, config?: RequestOptions): Promise<T> {
        return api<T>('patch', url, req, config);
    }
};

export default webapi;
