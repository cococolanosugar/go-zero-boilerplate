// catch(err: any) 清理的配套工具：对 unknown 抛出值做类型安全窄化

// 提取可展示的错误消息；请求层抛出的 ApiError 继承自 Error，天然命中第一分支
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

// Form.validateFields() 校验失败的 reject 值携带 errorFields（非 Error 实例），
// 该类错误已由表单内联提示，调用方应直接 return 不重复弹错
export function isFormValidateError(err: unknown): boolean {
  return !!err && typeof err === 'object' && 'errorFields' in err;
}
