import React, { createContext, useContext, useState } from "react";
import { defaultSettings, type PortalDefaultSettings } from "../config/defaultSettings";
import { STORAGE_KEYS } from "../constants";

interface LayoutSettingsContextType {
  settings: Partial<PortalDefaultSettings>;
  setSettings: (settings: Partial<PortalDefaultSettings>) => void;
  toggleNavTheme: () => void;
  setIsDark: (dark: boolean) => void;
  isDark: boolean;
}

const LayoutSettingsContext = createContext<LayoutSettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  toggleNavTheme: () => {},
  setIsDark: () => {},
  isDark: false,
});

export const LayoutSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettingsState] = useState<Partial<PortalDefaultSettings>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_SETTINGS);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("[Portal] 加载布局配置异常:", e);
    }
    return defaultSettings;
  });

  const setSettings = (newSettings: Partial<PortalDefaultSettings>) => {
    setSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.LAYOUT_SETTINGS, JSON.stringify(merged));
      } catch (e) {
        console.error("[Portal] 持久化布局配置异常:", e);
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

  const setIsDark = (dark: boolean) => {
    setSettings({
      ...settings,
      navTheme: dark ? "realDark" : "light",
    });
  };

  return (
    <LayoutSettingsContext.Provider
      value={{
        settings,
        setSettings,
        toggleNavTheme,
        setIsDark,
        isDark,
      }}
    >
      {children}
    </LayoutSettingsContext.Provider>
  );
};

export const useLayoutSettings = () => useContext(LayoutSettingsContext);