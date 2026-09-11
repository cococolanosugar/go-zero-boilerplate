import { useRef, useEffect, useCallback } from "react";

/**
 * 提供组件生命周期绑定的 AbortController
 * 当组件卸载或用户主动触发 abort() 时自动中断在途网络请求
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const getSignal = useCallback(() => {
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController();
    }
    return controllerRef.current.signal;
  }, []);

  const abort = useCallback((reason?: any) => {
    if (controllerRef.current && !controllerRef.current.signal.aborted) {
      controllerRef.current.abort(reason);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (controllerRef.current && !controllerRef.current.signal.aborted) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { getSignal, abort };
}
