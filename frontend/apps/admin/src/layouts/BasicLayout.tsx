import React, { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { App as AntdApp, Dropdown, Space, Tag, Tooltip } from "antd";
import {
  ProLayout,
  SettingDrawer,
  DefaultFooter,
} from "@ant-design/pro-components";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SunOutlined,
  MoonOutlined,
  GithubOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
  ApiOutlined,
  BookOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { setToken, type SysMenuItem } from "@zero/api";
import { APP_NAME } from "@zero/shared";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocale, useIntl } from "../contexts/LocaleContext";
import { LOCALES } from "../locales";

const getIcon = (iconName?: string) => {
  switch (iconName) {
    case "DashboardOutlined":
      return <DashboardOutlined />;
    case "ShoppingCartOutlined":
      return <ShoppingCartOutlined />;
    case "UserOutlined":
      return <UserOutlined />;
    case "SettingOutlined":
      return <SettingOutlined />;
    case "SafetyCertificateOutlined":
      return <SafetyCertificateOutlined />;
    case "MenuOutlined":
      return <MenuOutlined />;
    case "ApiOutlined":
      return <ApiOutlined />;
    case "BookOutlined":
      return <BookOutlined />;
    case "HistoryOutlined":
      return <HistoryOutlined />;
    default:
      return <AppstoreOutlined />;
  }
};

const getMenuLocaleKey = (path: string) => {
  const map: Record<string, string> = {
    "/dashboard": "menu.dashboard",
    "/orders": "menu.orders",
    "/users": "menu.users",
    "/system": "menu.system",
    "/system/users": "menu.system.users",
    "/system/roles": "menu.system.roles",
    "/system/menus": "menu.system.menus",
    "/system/apis": "menu.system.apis",
    "/system/dicts": "menu.system.dicts",
    "/system/logs": "menu.system.logs",
  };
  return map[path] || `menu.${path.replace(/^\//, "").replace(/\//g, ".")}`;
};

const formatRoutes = (
  items: SysMenuItem[],
  formatMessage: (d: { id: string; defaultMessage?: string }) => string
): any[] => {
  return (items || []).map((item) => {
    const localeKey = getMenuLocaleKey(item.path);
    const localizedName = formatMessage({ id: localeKey, defaultMessage: item.title });
    return {
      path: item.path,
      name: localizedName,
      locale: localeKey,
      icon: getIcon(item.icon),
      routes:
        item.children && item.children.length > 0
          ? formatRoutes(item.children, formatMessage)
          : undefined,
    };
  });
};

const getDefaultRouteConfig = (
  formatMessage: (d: { id: string; defaultMessage?: string }) => string
) => ({
  path: "/",
  routes: [
    {
      path: "/dashboard",
      name: formatMessage({ id: "menu.dashboard", defaultMessage: "监控大盘" }),
      locale: "menu.dashboard",
      icon: <DashboardOutlined />,
    },
    {
      path: "/orders",
      name: formatMessage({ id: "menu.orders", defaultMessage: "订单管理" }),
      locale: "menu.orders",
      icon: <ShoppingCartOutlined />,
    },
    {
      path: "/users",
      name: formatMessage({ id: "menu.users", defaultMessage: "用户中心" }),
      locale: "menu.users",
      icon: <UserOutlined />,
    },
    {
      path: "/system",
      name: formatMessage({ id: "menu.system", defaultMessage: "系统与权限" }),
      locale: "menu.system",
      icon: <SettingOutlined />,
      routes: [
        {
          path: "/system/users",
          name: formatMessage({ id: "menu.system.users", defaultMessage: "员工管理" }),
          locale: "menu.system.users",
          icon: <UserOutlined />,
        },
        {
          path: "/system/roles",
          name: formatMessage({ id: "menu.system.roles", defaultMessage: "角色管理" }),
          locale: "menu.system.roles",
          icon: <SafetyCertificateOutlined />,
        },
        {
          path: "/system/menus",
          name: formatMessage({ id: "menu.system.menus", defaultMessage: "菜单权限" }),
          locale: "menu.system.menus",
          icon: <MenuOutlined />,
        },
        {
          path: "/system/apis",
          name: formatMessage({ id: "menu.system.apis", defaultMessage: "接口字典" }),
          locale: "menu.system.apis",
          icon: <ApiOutlined />,
        },
        {
          path: "/system/dicts",
          name: formatMessage({ id: "menu.system.dicts", defaultMessage: "数据字典" }),
          locale: "menu.system.dicts",
          icon: <BookOutlined />,
        },
        {
          path: "/system/logs",
          name: formatMessage({ id: "menu.system.logs", defaultMessage: "审计日志" }),
          locale: "menu.system.logs",
          icon: <HistoryOutlined />,
        },
      ],
    },
  ],
});

export const BasicLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, setSettings, toggleNavTheme, isDark } = useLayoutSettings();
  const { profile, menus, isSuperAdmin, refreshProfile } = useAuth();
  const { locale, setLocale } = useLocale();
  const { formatMessage } = useIntl();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    refreshProfile();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [refreshProfile]);

  const handleLogout = () => {
    setToken(null);
    message.success(formatMessage({ id: "navBar.logout.success", defaultMessage: "已安全退出登录" }));
    navigate("/login", { replace: true });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 动态构建路由结构（优先使用后端根据角色权限下发的菜单树，同时深度注入国际化多语言热更新）
  const routeData = useMemo(() => {
    if (menus && menus.length > 0) {
      return {
        path: "/",
        routes: formatRoutes(menus, formatMessage),
      };
    }
    return getDefaultRouteConfig(formatMessage);
  }, [menus, locale, formatMessage]);

  const displayName = profile?.realName || profile?.username || formatMessage({ id: "common.admin", defaultMessage: "管理员" });

  return (
    <div style={{ height: "100vh" }}>
      <ProLayout
        key={locale}
        {...settings}
        formatMessage={formatMessage}
        title={APP_NAME}
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        route={routeData}
        location={{ pathname: location.pathname }}
        waterMarkProps={{
          content: `${displayName} (${APP_NAME})`,
        }}
        menuItemRender={(item, dom) => (
          <div
            onClick={() => {
              if (item.path) {
                navigate(item.path);
              }
            }}
          >
            {dom}
          </div>
        )}
        actionsRender={() => [
          <Dropdown
            key="lang"
            menu={{
              selectedKeys: [locale],
              items: Object.values(LOCALES).map((item) => ({
                key: item.key,
                label: (
                  <Space>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Space>
                ),
                onClick: () => setLocale(item.key),
              })),
            }}
          >
            <span style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}>
              <Tooltip title={formatMessage({ id: "navBar.lang", defaultMessage: "语言选择" })}>
                <TranslationOutlined />
              </Tooltip>
            </span>
          </Dropdown>,
          <Tooltip key="theme" title={isDark ? formatMessage({ id: "navBar.theme.light", defaultMessage: "切换为浅色模式" }) : formatMessage({ id: "navBar.theme.dark", defaultMessage: "切换为暗黑模式" })}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={toggleNavTheme}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </span>
          </Tooltip>,
          <Tooltip key="fullscreen" title={isFullscreen ? formatMessage({ id: "navBar.fullscreen.exit", defaultMessage: "退出全屏" }) : formatMessage({ id: "navBar.fullscreen.enter", defaultMessage: "全屏模式" })}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </span>
          </Tooltip>,
          <Tooltip key="portal" title={formatMessage({ id: "navBar.portal", defaultMessage: "前往官方前台门户系统 (:3000)" })}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("http://localhost:3000", "_blank")}
            >
              <GlobalOutlined />
            </span>
          </Tooltip>,
          <Tooltip key="help" title={formatMessage({ id: "navBar.help", defaultMessage: "查看微服务文档与使用指南" })}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("https://go-zero.dev", "_blank")}
            >
              <QuestionCircleOutlined />
            </span>
          </Tooltip>,
          <Tooltip key="github" title={formatMessage({ id: "navBar.github", defaultMessage: "查看 GitHub 仓库" })}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("https://github.com/zeromicro/go-zero", "_blank")}
            >
              <GithubOutlined />
            </span>
          </Tooltip>,
        ]}
        avatarProps={{
          src: profile?.avatar || "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
          title: displayName,
          render: (_props, dom) => (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "user",
                    label: (
                      <Space>
                        <UserOutlined />
                        <span>{displayName}</span>
                        {isSuperAdmin ? (
                          <Tag color="gold">{formatMessage({ id: "role.superAdmin", defaultMessage: "超级管理员" })}</Tag>
                        ) : (
                          (profile?.roles || []).map((r, i) => (
                            <Tag key={i} color="blue">
                              {r}
                            </Tag>
                          ))
                        )}
                      </Space>
                    ),
                    disabled: true,
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: formatMessage({ id: "navBar.logout", defaultMessage: "退出登录" }),
                    danger: true,
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {dom}
              </div>
            </Dropdown>
          ),
        }}
        footerRender={() => (
          <DefaultFooter
            copyright={`2026 ${APP_NAME} 工业级全栈 Monorepo`}
            links={[
              {
                key: "go-zero",
                title: "go-zero 微服务",
                href: "https://go-zero.dev",
                blankTarget: true,
              },
              {
                key: "github",
                title: <GithubOutlined />,
                href: "https://github.com/zeromicro/go-zero",
                blankTarget: true,
              },
              {
                key: "Ant Design",
                title: "Ant Design 6.6.2",
                href: "https://ant.design",
                blankTarget: true,
              },
            ]}
          />
        )}
      >
        <Outlet />
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