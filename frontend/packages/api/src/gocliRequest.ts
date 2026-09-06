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

    constructor(code: number, message: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.data = data;
    }
}

let authToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export function setToken(token: string | null) {
    authToken = token;
    if (typeof localStorage !== 'undefined') {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
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
    url,
    data,
    config = {}
}: {
    method: Method;
    url: string;
    data?: unknown;
    config?: unknown;
}) {
    const upperMethod = method.toLocaleUpperCase();
    const isGetOrHead = upperMethod === 'GET' || upperMethod === 'HEAD';

    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: upperMethod,
        credentials: 'include',
        headers,
        body: isGetOrHead ? undefined : (data ? JSON.stringify(data) : undefined),
        // @ts-ignore
        ...config
    });

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

        throw new ApiError(errorCode, errorMsg);
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
        throw new ApiError(res.code, res.msg || `Request failed with code ${res.code}`, res.data);
    }

    return res;
}

function api<T>(
    method: Method = 'get',
    url: string,
    req?: any,
    config?: unknown
): Promise<T> {
    if (url.match(/:/) || method.match(/get|delete/i)) {
        const queryParams = req ? (req.params || req.forms || req) : undefined;
        url = genUrl(url, queryParams);
    }
    method = method.toLocaleLowerCase() as Method;

    switch (method) {
        case 'get':
            return request({method: 'get', url, data: req, config});
        case 'delete':
            return request({method: 'delete', url, data: req, config});
        case 'put':
            return request({method: 'put', url, data: req, config});
        case 'post':
            return request({method: 'post', url, data: req, config});
        case 'patch':
            return request({method: 'patch', url, data: req, config});
        default:
            return request({method: 'post', url, data: req, config});
    }
}

export const webapi = {
    get<T>(url: string, req?: unknown, config?: unknown): Promise<T> {
        return api<T>('get', url, req, config);
    },
    delete<T>(url: string, req?: unknown, config?: unknown): Promise<T> {
        return api<T>('delete', url, req, config);
    },
    put<T>(url: string, req?: unknown, config?: unknown): Promise<T> {
        return api<T>('put', url, req, config);
    },
    post<T>(url: string, req?: unknown, config?: unknown): Promise<T> {
        return api<T>('post', url, req, config);
    },
    patch<T>(url: string, req?: unknown, config?: unknown): Promise<T> {
        return api<T>('patch', url, req, config);
    }
};

export default webapi
