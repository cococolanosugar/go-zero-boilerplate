/**
 * 动态计算企业管理后台 (Admin) 访问地址
 * 优先读取环境变量 VITE_ADMIN_URL，无配置时基于当前浏览器 Host 自适应（端口 3001）
 */
export function getAdminPortalUrl(): string {
  if (typeof window !== "undefined") {
    const envUrl = (import.meta as any).env?.VITE_ADMIN_URL;
    if (envUrl) {
      return envUrl;
    }
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }
  return "http://localhost:3001";
}
