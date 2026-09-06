import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  adminLogin,
  login,
  getAdminProfile,
  getToken,
  setToken,
  type AdminProfileResp,
  type AdminLoginReq,
  type LoginReq,
} from "@zero/api";

interface AuthContextType {
  profile: AdminProfileResp | null;
  isLoggedIn: boolean;
  loading: boolean;
  loginAsSysUser: (req: AdminLoginReq) => Promise<void>;
  loginAsMobile: (req: LoginReq) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  isLoggedIn: false,
  loading: true,
  loginAsSysUser: async () => {},
  loginAsMobile: async () => {},
  logout: () => {},
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
      console.warn("未获取到系统员工画像（可能是普通用户或Token失效）:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const loginAsSysUser = async (req: AdminLoginReq) => {
    const res = await adminLogin(req);
    setToken(res.accessToken);
    await refreshProfile();
  };

  const loginAsMobile = async (req: LoginReq) => {
    const res = await login(req);
    setToken(res.accessToken);
    await refreshProfile();
  };

  const logout = () => {
    setToken(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoggedIn: !!getToken(),
        loading,
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
