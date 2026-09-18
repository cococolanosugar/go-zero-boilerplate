import React, { createContext, useContext, useCallback, useMemo } from "react";
import {
  adminLogin,
  setToken,
  type AdminProfileResp,
  type AdminLoginReq,
} from "@zero/api";
import { useInitialState } from "./InitialStateContext";
import { broadcastSessionEvent } from "@zero/shared";

interface AuthContextType {
  profile: AdminProfileResp | null;
  isLoggedIn: boolean;
  loading: boolean;
  permissions: string[];
  roles: string[];
  isSuperAdmin: boolean;
  hasPermission: (perm: string | string[], mode?: "all" | "one") => boolean;
  hasRole: (role: string | string[], mode?: "all" | "one") => boolean;
  loginAsSysUser: (req: AdminLoginReq) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  isLoggedIn: false,
  loading: true,
  permissions: [],
  roles: [],
  isSuperAdmin: false,
  hasPermission: () => false,
  hasRole: () => false,
  loginAsSysUser: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialState, setInitialState, refreshInitialState } = useInitialState();

  const profile = initialState.currentUser || null;
  const roles = useMemo(() => profile?.roles || [], [profile]);
  const permissions = useMemo(() => profile?.permissions || roles, [profile, roles]);
  const isSuperAdmin = useMemo(
    () => profile?.id === 1 || roles.includes("ROLE_ADMIN") || roles.includes("admin"),
    [profile, roles]
  );

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

  const loginAsSysUser = useCallback(
    async (req: AdminLoginReq) => {
      const res = await adminLogin(req);
      setToken(res.accessToken);
      broadcastSessionEvent("AUTH_LOGIN", { token: res.accessToken });
      await refreshInitialState();
    },
    [refreshInitialState]
  );

  const logout = useCallback(() => {
    setToken("");
    setInitialState({
      currentUser: null,
      isLoggedIn: false,
      loading: false,
    });
    broadcastSessionEvent("AUTH_LOGOUT", null);
  }, [setInitialState]);

  const refreshProfile = useCallback(async () => {
    await refreshInitialState();
  }, [refreshInitialState]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      profile,
      isLoggedIn: !!initialState.isLoggedIn,
      loading: !!initialState.loading,
      permissions,
      roles,
      isSuperAdmin,
      hasPermission,
      hasRole,
      loginAsSysUser,
      logout,
      refreshProfile,
    }),
    [
      profile,
      initialState.isLoggedIn,
      initialState.loading,
      permissions,
      roles,
      isSuperAdmin,
      hasPermission,
      hasRole,
      loginAsSysUser,
      logout,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
