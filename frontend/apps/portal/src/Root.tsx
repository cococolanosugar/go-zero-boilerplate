import React from "react";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { LayoutSettingsProvider, useLayoutSettings } from "./contexts/LayoutSettingsContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { InitialStateProvider } from "./contexts/InitialStateContext";
import { getInitialState } from "./app";
import { AppRouter } from "./router";
import { setPortalAppFeedback } from "./requestErrorConfig";

import { addSessionSyncListener } from "@zero/shared";

const FeedbackInitializer: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  React.useEffect(() => {
    setPortalAppFeedback({ message, notification });
  }, [message, notification]);
  return null;
};

const SessionSyncBridge: React.FC = () => {
  const { setSettings } = useLayoutSettings();
  const { setLocale } = useLocale();

  React.useEffect(() => {
    return addSessionSyncListener((payload) => {
      if (payload.type === "AUTH_LOGOUT") {
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = `/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      } else if (payload.type === "THEME_CHANGE" && payload.data) {
        setSettings(payload.data);
      } else if (payload.type === "LOCALE_CHANGE" && payload.data?.locale) {
        setLocale(payload.data.locale);
      }
    });
  }, [setSettings, setLocale]);

  return null;
};

const ThemedApp: React.FC = () => {
  const { settings, isDark } = useLayoutSettings();
  const { currentConfig } = useLocale();

  return (
    <ConfigProvider
      locale={currentConfig.antdLocale}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: settings.colorPrimary || "#722ed1",
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        },
      }}
    >
      <AntdApp>
        <FeedbackInitializer />
        <SessionSyncBridge />
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