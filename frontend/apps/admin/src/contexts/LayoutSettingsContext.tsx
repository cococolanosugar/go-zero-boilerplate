import React, { createContext, useContext, useState } from "react";
import type { ProSettings } from "@ant-design/pro-components";

const STORAGE_KEY = "zero_admin_layout_settings";

import { defaultSettings } from "../config/defaultSettings";

interface LayoutSettingsContextType {
  settings: Partial<ProSettings>;
  setSettings: (settings: Partial<ProSettings>) => void;
  toggleNavTheme: () => void;
  isDark: boolean;
}

const LayoutSettingsContext = createContext<LayoutSettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  toggleNavTheme: () => {},
  isDark: false,
});

export const LayoutSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettingsState] = useState<Partial<ProSettings>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("加载布局配置异常:", e);
    }
    return defaultSettings;
  });

  const setSettings = (newSettings: Partial<ProSettings>) => {
    setSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error("持久化布局配置异常:", e);
      }
      return merged;
    });
  };

  const isDark = settings.navTheme === "realDark";

  const toggleNavTheme = () => {
    setSettings({
      ...settings,
      navTheme: isDark ? "light" : "realDark",
    });
  };

  return (
    <LayoutSettingsContext.Provider
      value={{
        settings,
        setSettings,
        toggleNavTheme,
        isDark,
      }}
    >
      {children}
    </LayoutSettingsContext.Provider>
  );
};

export const useLayoutSettings = () => useContext(LayoutSettingsContext);