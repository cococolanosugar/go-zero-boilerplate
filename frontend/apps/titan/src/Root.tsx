import React, { useState, useEffect } from "react";
import { ConfigProvider, App as AntdApp, theme, Alert } from "antd";
import { LayoutSettingsProvider, useLayoutSettings } from "./contexts/LayoutSettingsContext";
import { LocaleProvider, useLocale, useIntl } from "./contexts/LocaleContext";
import { InitialStateProvider } from "./contexts/InitialStateContext";
import { getInitialState } from "./app";
import { AppRouter } from "./router";
import { setTitanAppFeedback } from "./requestErrorConfig";
import { addSessionSyncListener } from "@zero/shared";

const FeedbackInitializer: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  useEffect(() => {
    setTitanAppFeedback({ message, notification });
  }, [message, notification]);
  return null;
};

const SessionSyncBridge: React.FC = () => {
  const { setSettings } = useLayoutSettings();
  const { setLocale } = useLocale();

  useEffect(() => {
    return addSessionSyncListener((payload) => {
      if (payload.type === "THEME_CHANGE" && payload.data) {
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
          colorPrimary: settings.colorPrimary || "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <FeedbackInitializer />
        <OfflineGuard />
        <SessionSyncBridge />
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
};

export const Root: React.FC = () => {
  return (
    <LayoutSettingsProvider>
      <LocaleProvider>
        <InitialStateProvider getInitialState={getInitialState}>
          <ThemedApp />
        </InitialStateProvider>
      </LocaleProvider>
    </LayoutSettingsProvider>
  );
};

export default Root;
