import type { UserProfileResp } from "@zero/api";

export interface AccessResult {
  canAccess: (accessCode?: string | string[]) => boolean;
  canAdmin: boolean;
}

/**
 * 声明式权限判定引擎（对齐 Ant Design Pro 的 access.ts 规范）
 * 注意：前端判定仅用于 UI 呈现与视图层路由守卫，真实系统安全受网关 RBAC 拦截切面保护
 * 传入当前用户画像，输出路由与功能点访问判定结果
 */
export function getAccess(profile?: UserProfileResp | null): AccessResult {
  const roles = profile?.roles || [];
  const permissions = new Set((profile as any)?.permissions || roles);
  const canAdmin =
    roles.includes("ROLE_ADMIN") ||
    roles.includes("admin");

  return {
    canAdmin,
    canAccess: (accessCode?: string | string[]) => {
      // 1. 未声明权限的公开/基础功能默认通行
      if (!accessCode) return true;
      // 2. 超级管理员直接全局豁免
      if (canAdmin) return true;

      // 3. 数组支持任意一个命中即放行
      if (Array.isArray(accessCode)) {
        return accessCode.some((code) => permissions.has(code));
      }
      return permissions.has(accessCode);
    },
  };
}

export default getAccess;