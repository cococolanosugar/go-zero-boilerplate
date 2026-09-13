import React, { useState, useEffect } from "react";
import { ConfigProvider, App as AntdApp, theme, Alert } from "antd";
import { LayoutSettingsProvider, useLayoutSettings } from "./contexts/LayoutSettingsContext";
import { LocaleProvider, useLocale, useIntl } from "./contexts/LocaleContext";
import { InitialStateProvider } from "./contexts/InitialStateContext";
import { getInitialState } from "./app";
import { AppRouter } from "./router";
import { setPortalAppFeedback } from "./requestErrorConfig";

import { addSessionSyncListener } from "@zero/shared";

const FeedbackInitializer: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  useEffect(() => {
    setPortalAppFeedback({ message, notification });
  }, [message, notification]);
  return null;
};

const SessionSyncBridge: React.FC = () => {
  const { setSettings } = useLayoutSettings();
  const { setLocale } = useLocale();

  useEffect(() => {
    return addSessionSyncListener((payload) => {
      if (payload.type === "AUTH_LOGOUT") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("portal:open-login", { detail: { reason: "logout" } }));
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

export const OfflineGuard: React.FC = () => {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== "undefined" && !navigator.onLine;
  });
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      message.success(
        formatMessage({ id: "common.networkRestored", defaultMessage: "网络连接已恢复" })
      );
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [message, formatMessage]);

  if (!isOffline) return null;

  return (
    <Alert
      banner
      type="warning"
      title={formatMessage({
        id: "common.offlineWarning",
        defaultMessage: "当前网络连接已断开，部分数据可能无法实时同步，请检查网络设置。",
      })}
      showIcon
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        width: "100%",
        textAlign: "center",
      }}
    />
  );
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
        <OfflineGuard />
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