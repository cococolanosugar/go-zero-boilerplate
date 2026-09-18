import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AdminProfileResp } from "@zero/api";

export interface TitanInitialState {
  currentUser?: AdminProfileResp | null;
  isLoggedIn?: boolean;
  loading?: boolean;
}

export interface TitanInitialStateContextType {
  initialState: TitanInitialState;
  setInitialState: React.Dispatch<React.SetStateAction<TitanInitialState>>;
  refreshInitialState: () => Promise<TitanInitialState>;
}

const defaultInitialState: TitanInitialState = {
  currentUser: null,
  isLoggedIn: false,
  loading: true,
};

const InitialStateContext = createContext<TitanInitialStateContextType>({
  initialState: defaultInitialState,
  setInitialState: () => {},
  refreshInitialState: async () => defaultInitialState,
});

export const InitialStateProvider: React.FC<{
  getInitialState: () => Promise<TitanInitialState>;
  children: React.ReactNode;
}> = ({ getInitialState, children }) => {
  const [initialState, setInitialState] = useState<TitanInitialState>(defaultInitialState);

  const refreshInitialState = useCallback(async () => {
    try {
      const state = await getInitialState();
      setInitialState(state);
      return state;
    } catch (e) {
      console.error("Failed to load titan initial state:", e);
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
