import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AdminProfileResp } from "@zero/api";

export interface PortalInitialState {
  currentUser?: AdminProfileResp | null;
  isLoggedIn?: boolean;
  loading?: boolean;
}

export interface PortalInitialStateContextType {
  initialState: PortalInitialState;
  setInitialState: React.Dispatch<React.SetStateAction<PortalInitialState>>;
  refreshInitialState: () => Promise<PortalInitialState>;
}

const defaultInitialState: PortalInitialState = {
  currentUser: null,
  isLoggedIn: false,
  loading: true,
};

const InitialStateContext = createContext<PortalInitialStateContextType>({
  initialState: defaultInitialState,
  setInitialState: () => {},
  refreshInitialState: async () => defaultInitialState,
});

/**
 * 门户全局运行时初始状态 Provider
 */
export const InitialStateProvider: React.FC<{
  getInitialState: () => Promise<PortalInitialState>;
  children: React.ReactNode;
}> = ({ getInitialState, children }) => {
  const [initialState, setInitialState] = useState<PortalInitialState>(defaultInitialState);

  const refreshInitialState = useCallback(async () => {
    try {
      const state = await getInitialState();
      setInitialState(state);
      return state;
    } catch (e) {
      console.error("Failed to load portal initial state:", e);
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
