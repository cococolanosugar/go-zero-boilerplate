import React from "react";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { LayoutSettingsProvider, useLayoutSettings } from "./contexts/LayoutSettingsContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { InitialStateProvider } from "./contexts/InitialStateContext";
import { getInitialState } from "./app";
import { AppRouter } from "./router";

import { setAppFeedback } from "./requestErrorConfig";

const FeedbackInitializer: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  React.useEffect(() => {
    setAppFeedback({ message, notification });
  }, [message, notification]);
  return null;
};

const ThemedApp: React.FC = () => {
  const { settings, isDark } = useLayoutSettings();
  const { currentConfig } = useLocale();

  const algorithms = [
    isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    ...(settings.compact ? [theme.compactAlgorithm] : []),
  ];

  return (
    <ConfigProvider
      locale={currentConfig.antdLocale}
      theme={{
        algorithm: algorithms,
        token: {
          colorPrimary: settings.colorPrimary || "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <FeedbackInitializer />
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
};

export default function Root() {
  return (
    <LocaleProvider>
      <LayoutSettingsProvider>
        <InitialStateProvider getInitialState={getInitialState}>
          <ThemedApp />
        </InitialStateProvider>
      </LayoutSettingsProvider>
    </LocaleProvider>
  );
}