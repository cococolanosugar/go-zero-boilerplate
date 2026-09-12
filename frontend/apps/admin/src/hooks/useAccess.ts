import { useMemo, useCallback } from "react";
import { useInitialState } from "../contexts/InitialStateContext";
import { getAccess, type AccessResult } from "../access";

export interface UseAccessResult extends AccessResult {
  hasPermission: (perm: string | string[], mode?: "all" | "one") => boolean;
  hasRole: (role: string | string[], mode?: "all" | "one") => boolean;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

/**
 * 细粒度权限控制 Hook（对齐 Ant Design Pro useAccess 规范）
 * 贯穿全局 InitialState 与 access 判定引擎
 */
export function useAccess(): UseAccessResult {
  const { initialState } = useInitialState();
  const currentUser = initialState.currentUser;
  const access = useMemo(() => getAccess(currentUser), [currentUser]);

  const roles = useMemo(() => {
    return initialState.roles || currentUser?.roles || [];
  }, [initialState.roles, currentUser?.roles]);

  const permissions = useMemo(() => {
    return initialState.permissions || currentUser?.permissions || [];
  }, [initialState.permissions, currentUser?.permissions]);

  const isSuperAdmin = access.canAdmin;

  const hasPermission = useCallback(
    (perm: string | string[], mode: "all" | "one" = "one"): boolean => {
      if (isSuperAdmin) return true;
      if (!perm) return true;

      const permArray = Array.isArray(perm) ? perm : [perm];
      if (permArray.length === 0) return true;

      if (mode === "all") {
        return permArray.every((p) => permissions.includes(p));
      }
      return permArray.some((p) => permissions.includes(p));
    },
    [isSuperAdmin, permissions]
  );

  const hasRole = useCallback(
    (role: string | string[], mode: "all" | "one" = "one"): boolean => {
      if (isSuperAdmin) return true;
      if (!role) return true;

      const roleArray = Array.isArray(role) ? role : [role];
      if (roleArray.length === 0) return true;

      if (mode === "all") {
        return roleArray.every((r) => roles.includes(r));
      }
      return roleArray.some((r) => roles.includes(r));
    },
    [isSuperAdmin, roles]
  );

  return {
    ...access,
    hasPermission,
    hasRole,
    isSuperAdmin,
    roles,
    permissions,
  };
}

export default useAccess;
