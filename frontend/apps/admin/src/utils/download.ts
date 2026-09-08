/**
 * 浏览器端文件下载工具套件
 */

/**
 * 通过二进制 Blob 对象触发浏览器原生文件下载
 * @param blob 二进制对象
 * @param filename 下载保存的文件名（含后缀）
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  // 延迟回收对象 URL，避免部分浏览器在下载触发前提前销毁
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * 通过 URL 触发文件直接下载或在新标签页打开
 * @param url 文件目标链接
 * @param filename 可选指定的文件名
 * @param target 打开方式，默认为 _blank
 */
export function downloadByUrl(url: string, filename?: string, target = "_blank"): void {
  if (typeof window === "undefined") return;

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.target = target;
  if (filename) {
    a.download = filename;
  }

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
  }, 500);
}

/**
 * 从 Content-Disposition 响应头提取服务端设定的文件名
 * @param disposition Content-Disposition 响应头字符串
 * @param defaultName 兜底文件名
 */
export function extractFilenameFromDisposition(
  disposition?: string,
  defaultName = `export_${Date.now()}`
): string {
  if (!disposition) return defaultName;

  const utf8Match = disposition.match(/filename\*=utf-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const normalMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (normalMatch && normalMatch[1]) {
    return decodeURIComponent(normalMatch[1]);
  }

  return defaultName;
}
