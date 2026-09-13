import React, { createContext, useContext, useCallback, useMemo } from "react";
import {
  adminLogin,
  login,
  setToken,
  type UserProfileResp,
  type AdminLoginReq,
  type LoginReq,
} from "@zero/api";
import { useInitialState } from "./InitialStateContext";

interface AuthContextType {
  profile: UserProfileResp | null;
  isLoggedIn: boolean;
  loading: boolean;
  permissions: string[];
  roles: string[];
  isSuperAdmin: boolean;
  hasPermission: (perm: string | string[], mode?: "all" | "one") => boolean;
  hasRole: (role: string | string[], mode?: "all" | "one") => boolean;
  loginAsSysUser: (req: AdminLoginReq) => Promise<void>;
  loginAsMobile: (req: LoginReq) => Promise<void>;
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
  loginAsMobile: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialState, setInitialState, refreshInitialState } = useInitialState();

  const profile = initialState.currentUser || null;
  const roles = useMemo(() => profile?.roles || [], [profile]);
  const permissions = useMemo(() => (profile as any)?.permissions || roles, [profile, roles]);
  const isSuperAdmin = useMemo(
    () => roles.includes("ROLE_ADMIN") || roles.includes("admin"),
    [roles]
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

  const refreshProfile = useCallback(async () => {
    await refreshInitialState();
  }, [refreshInitialState]);

  const loginAsSysUser = async (req: AdminLoginReq) => {
    const res = await adminLogin(req);
    setToken(res.accessToken);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("portal_login_type", "sys");
      localStorage.removeItem("portal_mobile_user");
    }
    await refreshInitialState();
  };

  const loginAsMobile = async (req: LoginReq) => {
    const res = await login(req);
    setToken(res.accessToken);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("portal_login_type", "mobile");
      localStorage.removeItem("portal_mobile_user");
    }
    await refreshInitialState();
  };

  const logout = () => {
    setToken(null);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("portal_login_type");
      localStorage.removeItem("portal_mobile_user");
    }
    setInitialState({ currentUser: null, isLoggedIn: false, loading: false });
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoggedIn: !!initialState.isLoggedIn,
        loading: !!initialState.loading,
        permissions,
        roles,
        isSuperAdmin,
        hasPermission,
        hasRole,
        loginAsSysUser,
        loginAsMobile,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;