import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { InitialStateProvider } from "./contexts/InitialStateContext";
import { getInitialState } from "./app";
import { routes } from "./config/routes";
import { RouteRenderer } from "./router/RouteRenderer";

import { setPortalAppFeedback } from "./requestErrorConfig";

const FeedbackInitializer: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  React.useEffect(() => {
    setPortalAppFeedback({ message, notification });
  }, [message, notification]);
  return null;
};

const AppContent: React.FC = () => {
  const { currentConfig } = useLocale();

  return (
    <ConfigProvider
      locale={currentConfig.antdLocale}
      theme={{
        token: {
          colorPrimary: "#722ed1",
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        },
      }}
    >
      <AntdApp>
        <FeedbackInitializer />
        <AuthProvider>
          <BrowserRouter>
            <RouteRenderer routes={routes} />
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default function Root() {
  return (
    <LocaleProvider>
      <InitialStateProvider getInitialState={getInitialState}>
        <AppContent />
      </InitialStateProvider>
    </LocaleProvider>
  );
}
