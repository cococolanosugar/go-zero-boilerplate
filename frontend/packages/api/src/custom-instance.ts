import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, handleUnauthorized, ApiError } from './gocliRequest';

export const AXIOS_INSTANCE = axios.create({
  baseURL: '',
  timeout: 30000,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 200 || res.code === 0) {
        return res.data;
      }
      if (res.code === 100003) {
        handleUnauthorized();
      }
      throw new ApiError(
        res.code,
        res.msg || `Request failed with code ${res.code}`,
        res.data
      );
    }
    return res;
  },
  (error: AxiosError<any>) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      throw error;
    }
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    const respData = error.response?.data;
    const code = respData?.code || error.response?.status || -1;
    const msg = respData?.msg || error.message || '网络连接异常或服务未启动';
    throw new ApiError(code, msg, respData);
  }
);

/**
 * Custom Axios mutator for Orval code generation
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  }).then((res) => res as unknown as T);
};

export default customInstance;
