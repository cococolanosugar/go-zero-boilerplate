/**
 * 函数防抖 (Debounce)
 * 连续触发时，只在最后一次调用的 wait 毫秒后执行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/**
 * 函数节流 (Throttle)
 * 连续触发时，在 wait 毫秒内最多只执行一次，且尾随调用保存最新参数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastExecTime);
    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastExecTime = now;
      lastArgs = null;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastExecTime = Date.now();
        timer = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastExecTime = 0;
    lastArgs = null;
  };

  return throttled;
}
