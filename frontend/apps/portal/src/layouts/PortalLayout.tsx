import React, { useState, useMemo } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { App as AntdApp } from "antd";
import { ProLayout } from "@ant-design/pro-components";
import { useAuth } from "../contexts/AuthContext";
import { useLocale, useIntl } from "../contexts/LocaleContext";
import { useInitialState } from "../contexts/InitialStateContext";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";
import { LoginModal } from "../components/LoginModal";
import { ProfileDrawer } from "../components/ProfileDrawer";
import { layout } from "../app";

/**
 * 门户顶层基础布局容器（纯视图 Shell）
 * 所有的业务插槽与运行时交互委托至 src/app.tsx layout() 函数
 */
export const PortalLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { initialState, setInitialState } = useInitialState();
  const { logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const { formatMessage } = useIntl();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const { isDark, setIsDark } = useLayoutSettings();

  const layoutConfig = useMemo(() => {
    return layout({
      initialState,
      setInitialState,
      navigate,
      formatMessage,
      message,
      locale,
      setLocale,
      isDark,
      setIsDark,
      onOpenLogin: () => setLoginModalOpen(true),
      onOpenProfile: () => setProfileDrawerOpen(true),
      onLogout: () => {
        logout();
        message.success(
          formatMessage({
            id: "portal.header.logoutSuccess",
            defaultMessage: "已安全退出登录",
          })
        );
      },
    });
  }, [
    initialState,
    setInitialState,
    navigate,
    formatMessage,
    message,
    locale,
    setLocale,
    isDark,
    logout,
  ]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <ProLayout
        key={locale}
        {...layoutConfig}
        route={layoutConfig.routeData}
        location={{ pathname: location.pathname }}
      >
        <Outlet context={{ onOpenLogin: () => setLoginModalOpen(true) }} />
      </ProLayout>

      {/* 登录弹窗 */}
      <LoginModal
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
      />

      {/* 员工画像抽屉 */}
      <ProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />
    </div>
  );
};

export default PortalLayout;
