import { useEffect } from "react";

export interface UseUnsavedWarningOptions {
  message?: string;
  enabled?: boolean;
}

/**
 * 表单/页面未保存拦截 Hook
 * 当 isDirty 为 true 且 enabled 为 true 时：
 * 自动监听 window beforeunload 事件，阻止用户意外关闭标签页、后退或刷新页面造成数据丢失。
 */
export function useUnsavedWarning(
  isDirty: boolean,
  options?: UseUnsavedWarningOptions
) {
  const enabled = options?.enabled ?? true;
  const message = options?.message ?? "您有尚未保存的表单数据，确定要离开当前页面吗？";

  useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, enabled, message]);

  return { isDirty };
}
