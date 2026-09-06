import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "../components/AuthGuard";
import { BasicLayout } from "../layouts/BasicLayout";
import { AuthProvider } from "../contexts/AuthContext";
import { LoginPage } from "../pages/Login";
import { DashboardPage } from "../pages/Dashboard";
import { OrdersPage } from "../pages/Orders";
import { UsersPage as UserCenterPage } from "../pages/Users";
import {
  UsersPage as SysUsersPage,
  RolesPage as SysRolesPage,
  MenusPage as SysMenusPage,
  ApisPage as SysApisPage,
  DictsPage as SysDictsPage,
  LogsPage as SysLogsPage,
} from "../pages/System";

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* 受鉴权守卫保护的后台系统路由 */}
          <Route path="/" element={<AuthGuard />}>
            <Route element={<BasicLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="users" element={<UserCenterPage />} />

              {/* 企业级系统与权限管理模块 */}
              <Route path="system">
                <Route index element={<Navigate to="/system/users" replace />} />
                <Route path="users" element={<SysUsersPage />} />
                <Route path="roles" element={<SysRolesPage />} />
                <Route path="menus" element={<SysMenusPage />} />
                <Route path="apis" element={<SysApisPage />} />
                <Route path="dicts" element={<SysDictsPage />} />
                <Route path="logs" element={<SysLogsPage />} />
              </Route>
            </Route>
          </Route>

          {/* 兜底重定向 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;