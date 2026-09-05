import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAdminProfile, getToken, type AdminProfileResp, type SysMenuItem } from "@zero/api";

interface AuthContextType {
  profile: AdminProfileResp | null;
  permissions: string[];
  roles: string[];
  menus: SysMenuItem[];
  isSuperAdmin: boolean;
  loading: boolean;
  hasPermission: (perm: string | string[], mode?: "all" | "one") => boolean;
  hasRole: (role: string | string[], mode?: "all" | "one") => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  permissions: [],
  roles: [],
  menus: [],
  isSuperAdmin: false,
  loading: true,
  hasPermission: () => false,
  hasRole: () => false,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<AdminProfileResp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getAdminProfile();
      setProfile(res);
    } catch (err) {
      console.error("Failed to load admin profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const roles = profile?.roles || [];
  const permissions = profile?.permissions || [];
  const menus = profile?.menus || [];
  const isSuperAdmin = roles.includes("ROLE_ADMIN") || roles.includes("admin");

  const hasPermission = useCallback(
    (perm: string | string[], mode: "all" | "one" = "one"): boolean => {
      // 超级管理员拥有所有权限
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

  return (
    <AuthContext.Provider
      value={{
        profile,
        permissions,
        roles,
        menus,
        isSuperAdmin,
        loading,
        hasPermission,
        hasRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
