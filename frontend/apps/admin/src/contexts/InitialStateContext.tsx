import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AdminProfileResp, SysMenuItem } from "@zero/api";

export interface InitialState {
  currentUser?: AdminProfileResp | null;
  permissions?: string[];
  roles?: string[];
  menus?: SysMenuItem[];
  isSuperAdmin?: boolean;
  loading?: boolean;
}

export interface InitialStateContextType {
  initialState: InitialState;
  setInitialState: React.Dispatch<React.SetStateAction<InitialState>>;
  refreshInitialState: () => Promise<InitialState>;
}

const defaultInitialState: InitialState = {
  currentUser: null,
  permissions: [],
  roles: [],
  menus: [],
  isSuperAdmin: false,
  loading: true,
};

const InitialStateContext = createContext<InitialStateContextType>({
  initialState: defaultInitialState,
  setInitialState: () => {},
  refreshInitialState: async () => defaultInitialState,
});

/**
 * 全局运行时初始状态 Provider（对齐 Ant Design Pro getInitialState 容器）
 */
export const InitialStateProvider: React.FC<{
  getInitialState: () => Promise<InitialState>;
  children: React.ReactNode;
}> = ({ getInitialState, children }) => {
  const [initialState, setInitialState] = useState<InitialState>(defaultInitialState);

  const refreshInitialState = useCallback(async () => {
    try {
      const state = await getInitialState();
      setInitialState(state);
      return state;
    } catch (e) {
      console.error("Failed to load initial state:", e);
      const fallback = { ...defaultInitialState, loading: false };
      setInitialState(fallback);
      return fallback;
    }
  }, [getInitialState]);

  useEffect(() => {
    refreshInitialState();
  }, [refreshInitialState]);

  return (
    <InitialStateContext.Provider value={{ initialState, setInitialState, refreshInitialState }}>
      {children}
    </InitialStateContext.Provider>
  );
};

export const useInitialState = () => useContext(InitialStateContext);

export default InitialStateContext;
