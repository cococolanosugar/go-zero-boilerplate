import React, { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { App as AntdApp } from "antd";
import { ProLayout, SettingDrawer, PageLoading } from "@ant-design/pro-components";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";
import { useLocale, useIntl } from "../contexts/LocaleContext";
import { useInitialState } from "../contexts/InitialStateContext";
import { MultiTabs } from "../components/MultiTabs";
import { CommandPalette } from "../components/CommandPalette";
import { layout } from "../app";

/**
 * 后台基础布局容器（纯视图 Shell）
 * 所有的业务插槽与运行时交互委托至 src/app.tsx layout() 函数
 */
export const BasicLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, setSettings, toggleNavTheme, isDark } = useLayoutSettings();
  const { initialState, setInitialState } = useInitialState();

  if (initialState.loading) {
    return <PageLoading />;
  }
  const { locale, setLocale } = useLocale();
  const { formatMessage } = useIntl();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 通过运行时配置计算完整的 ProLayout 属性字典
  const layoutConfig = useMemo(() => {
    return layout({
      initialState,
      setInitialState,
      navigate,
      formatMessage,
      message,
      settings,
      setSettings,
      toggleNavTheme,
      isDark,
      locale,
      setLocale,
      isFullscreen,
      toggleFullscreen,
    });
  }, [
    initialState,
    navigate,
    formatMessage,
    message,
    settings,
    setSettings,
    toggleNavTheme,
    isDark,
    locale,
    setLocale,
    isFullscreen,
  ]);

  return (
    <div style={{ height: "100vh" }}>
      <ProLayout
        key={locale}
        {...layoutConfig}
        route={layoutConfig.routeData}
        location={{ pathname: location.pathname }}
      >
        {settings.tabsLayout !== false && <MultiTabs />}
        <Outlet />
        <CommandPalette />
        <SettingDrawer
          enableDarkTheme
          settings={settings}
          onSettingChange={(newSettings) => {
            setSettings(newSettings);
          }}
          disableUrlParams
        />
      </ProLayout>
    </div>
  );
};

export default BasicLayout;