import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { routes } from "./config/routes";
import { RouteRenderer } from "./router/RouteRenderer";

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
        <AuthProvider>
          <BrowserRouter>
            <RouteRenderer routes={routes} />
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};


export default function App() {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
}
