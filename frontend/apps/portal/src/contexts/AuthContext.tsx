import React, { createContext, useContext, useCallback } from "react";
import {
  adminLogin,
  login,
  setToken,
  type AdminProfileResp,
  type AdminLoginReq,
  type LoginReq,
} from "@zero/api";
import { useInitialState } from "./InitialStateContext";

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
  const { initialState, setInitialState, refreshInitialState } = useInitialState();

  const refreshProfile = useCallback(async () => {
    await refreshInitialState();
  }, [refreshInitialState]);

  const loginAsSysUser = async (req: AdminLoginReq) => {
    const res = await adminLogin(req);
    setToken(res.accessToken);
    await refreshInitialState();
  };

  const loginAsMobile = async (req: LoginReq) => {
    const res = await login(req);
    setToken(res.accessToken);
    await refreshInitialState();
  };

  const logout = () => {
    setToken(null);
    setInitialState({ currentUser: null, isLoggedIn: false, loading: false });
  };

  return (
    <AuthContext.Provider
      value={{
        profile: initialState.currentUser || null,
        isLoggedIn: !!initialState.isLoggedIn,
        loading: !!initialState.loading,
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
