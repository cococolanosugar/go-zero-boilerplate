import React from "react";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { LayoutSettingsProvider, useLayoutSettings } from "./contexts/LayoutSettingsContext";
import { AppRouter } from "./router";

const ThemedApp: React.FC = () => {
  const { settings, isDark } = useLayoutSettings();

  return (
    <ConfigProvider
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
    <LayoutSettingsProvider>
      <ThemedApp />
    </LayoutSettingsProvider>
  );
}