import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AuthProvider } from "./contexts/AuthContext";
import { PortalLayout } from "./layouts/PortalLayout";
import { HomePage } from "./pages/Home";
import { ServicesPage } from "./pages/Services";
import { WorkbenchPage } from "./pages/Workbench";

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
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
            <Routes>
              <Route path="/" element={<PortalLayout />}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<HomePage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="workbench" element={<WorkbenchPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
