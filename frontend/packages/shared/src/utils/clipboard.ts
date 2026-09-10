/**
 * 跨浏览器文本复制工具函数
 * 优先调用现代 navigator.clipboard API，在非 HTTPS 或旧版浏览器环境下自动降级为隐藏 textarea + execCommand('copy')
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const str = String(text ?? "");

  // 1. 尝试使用现代 Clipboard API
  if (navigator?.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch {
      // 降级到 execCommand
    }
  }

  // 2. 降级方案：创建临时隐藏 textarea 触发 execCommand
  try {
    const textArea = document.createElement("textarea");
    textArea.value = str;
    // 隐藏元素，防止页面跳动
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
