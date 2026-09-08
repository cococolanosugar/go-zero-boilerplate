import React, { createContext, useContext, useState } from "react";
import { defaultSettings, type DefaultSettings } from "../config/defaultSettings";
import { STORAGE_KEYS } from "../constants";

interface LayoutSettingsContextType {
  settings: Partial<DefaultSettings>;
  setSettings: (settings: Partial<DefaultSettings>) => void;
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
  const [settings, setSettingsState] = useState<Partial<DefaultSettings>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_SETTINGS);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("加载布局配置异常:", e);
    }
    return defaultSettings;
  });

  const setSettings = (newSettings: Partial<DefaultSettings>) => {
    setSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.LAYOUT_SETTINGS, JSON.stringify(merged));
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