import React, { createContext, useContext, useState } from "react";
import { defaultSettings, type PortalDefaultSettings } from "../config/defaultSettings";
import { STORAGE_KEYS } from "../constants";
import { broadcastSessionEvent } from "@zero/shared";

export interface ThemeColorPreset {
  name: string;
  key: string;
  color: string;
}

export const PRESET_THEME_COLORS: ThemeColorPreset[] = [
  { name: "沉静紫 (Golden Purple)", key: "purple", color: "#722ed1" },
  { name: "拂晓蓝 (Daybreak Blue)", key: "daybreak", color: "#1677ff" },
  { name: "极客绿 (Polar Green)", key: "green", color: "#52c41a" },
  { name: "薄暮红 (Dust Red)", key: "red", color: "#f5222d" },
  { name: "火山橙 (Volcano Orange)", key: "volcano", color: "#fa541c" },
  { name: "日落黄 (Sunset Orange)", key: "orange", color: "#fa8c16" },
  { name: "明青色 (Cyan)", key: "cyan", color: "#13c2c2" },
  { name: "极光蓝 (Geek Blue)", key: "geekblue", color: "#2f54eb" },
];

interface LayoutSettingsContextType {
  settings: Partial<PortalDefaultSettings>;
  setSettings: (settings: Partial<PortalDefaultSettings>) => void;
  toggleNavTheme: () => void;
  setIsDark: (dark: boolean) => void;
  setColorPrimary: (color: string) => void;
  isDark: boolean;
  presetColors: ThemeColorPreset[];
}

const LayoutSettingsContext = createContext<LayoutSettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  toggleNavTheme: () => {},
  setIsDark: () => {},
  setColorPrimary: () => {},
  isDark: false,
  presetColors: PRESET_THEME_COLORS,
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
        broadcastSessionEvent("THEME_CHANGE", merged);
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

  const setColorPrimary = (color: string) => {
    setSettings({
      ...settings,
      colorPrimary: color,
    });
  };

  return (
    <LayoutSettingsContext.Provider
      value={{
        settings,
        setSettings,
        toggleNavTheme,
        setIsDark,
        setColorPrimary,
        isDark,
        presetColors: PRESET_THEME_COLORS,
      }}
    >
      {children}
    </LayoutSettingsContext.Provider>
  );
};

export const useLayoutSettings = () => useContext(LayoutSettingsContext);