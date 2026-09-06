import React from "react";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { LayoutSettingsProvider, useLayoutSettings } from "./contexts/LayoutSettingsContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { AppRouter } from "./router";

const ThemedApp: React.FC = () => {
  const { settings, isDark } = useLayoutSettings();
  const { currentConfig } = useLocale();

  return (
    <ConfigProvider
      locale={currentConfig.antdLocale}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: settings.colorPrimary || "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
};

export default function App() {
  return (
    <LocaleProvider>
      <LayoutSettingsProvider>
        <ThemedApp />
      </LayoutSettingsProvider>
    </LocaleProvider>
  );
}