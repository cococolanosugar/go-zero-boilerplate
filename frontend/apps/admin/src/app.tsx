import React from "react";
import { Dropdown, Space, Tag, Tooltip } from "antd";
import {
  DefaultFooter,
  type ProLayoutProps,
  type ProSettings,
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
import { getAdminProfile, getToken, setToken, type AdminProfileResp, type SysMenuItem } from "@zero/api";
import { APP_NAME } from "@zero/shared";
import { LOCALES, type LocaleKey } from "./locales";
import { routes as staticRoutes } from "./config/routes";
import type { AppRouteItem } from "./config/routes.types";
import { getAccess } from "./access";
import type { InitialState } from "./contexts/InitialStateContext";

const getIcon = (iconName?: React.ReactNode | string) => {
  if (React.isValidElement(iconName)) return iconName;
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

const formatStaticRoutes = (
  items: AppRouteItem[],
  formatMessage: (d: { id: string; defaultMessage?: string }) => string,
  canAccess: (accessCode?: string | string[]) => boolean
): any[] => {
  return (items || [])
    .filter((item) => {
      if (item.hideInMenu) return false;
      if (item.redirect && !item.name) return false;
      if (item.access && !canAccess(item.access)) return false;
      return true;
    })
    .map((item) => {
      const localeKey = item.locale || getMenuLocaleKey(item.path);
      const localizedName = formatMessage({ id: localeKey, defaultMessage: item.name });
      return {
        path: item.path,
        name: localizedName,
        locale: localeKey,
        icon: typeof item.icon === "string" ? getIcon(item.icon) : item.icon,
        routes:
          item.routes && item.routes.length > 0
            ? formatStaticRoutes(item.routes, formatMessage, canAccess)
            : undefined,
      };
    });
};

/**
 * 1. 运行时全局初始状态拉取（对齐 Ant Design Pro getInitialState 规范）
 */
export async function getInitialState(): Promise<InitialState> {
  const token = getToken();
  if (!token) {
    return {
      currentUser: null,
      permissions: [],
      roles: [],
      menus: [],
      isSuperAdmin: false,
      loading: false,
    };
  }

  try {
    const res = await getAdminProfile();
    const roles = res?.roles || [];
    const isSuperAdmin = res?.id === 1 || roles.includes("ROLE_ADMIN") || roles.includes("admin");
    return {
      currentUser: res,
      permissions: res?.permissions || [],
      roles,
      menus: res?.menus || [],
      isSuperAdmin,
      loading: false,
    };
  } catch (err) {
    console.error("Failed to load initial admin profile:", err);
    return {
      currentUser: null,
      permissions: [],
      roles: [],
      menus: [],
      isSuperAdmin: false,
      loading: false,
    };
  }
}

export interface RuntimeLayoutContext {
  initialState: InitialState;
  setInitialState: React.Dispatch<React.SetStateAction<InitialState>>;
  navigate: (to: string, options?: any) => void;
  formatMessage: (descriptor: { id: string; defaultMessage?: string }) => string;
  message: any;
  settings: ProSettings;
  setSettings: (settings: ProSettings) => void;
  toggleNavTheme: () => void;
  isDark: boolean;
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

/**
 * 2. 运行时布局配置导出（对齐 Ant Design Pro layout 运行时规范）
 * 统筹管理头像下拉、多语言、暗黑模式切换、全屏、水印、页脚与动态菜单路由
 */
export const layout = (ctx: RuntimeLayoutContext): ProLayoutProps & { routeData: any } => {
  const {
    initialState,
    navigate,
    formatMessage,
    message,
    settings,
    toggleNavTheme,
    isDark,
    locale,
    setLocale,
    isFullscreen,
    toggleFullscreen,
  } = ctx;

  const { currentUser, isSuperAdmin, menus } = initialState;
  const accessInstance = getAccess(currentUser);

  // 动态构建路由结构（优先使用后端动态菜单树；无动态树时使用编译时静态配置，并结合 access 进行权限过滤）
  let routeData: any;
  if (menus && menus.length > 0) {
    routeData = {
      path: "/",
      routes: formatRoutes(menus, formatMessage),
    };
  } else {
    const mainRoutes = staticRoutes.find((r) => r.path === "/" && r.layout === true)?.routes || [];
    routeData = {
      path: "/",
      routes: formatStaticRoutes(mainRoutes, formatMessage, accessInstance.canAccess),
    };
  }

  const displayName =
    currentUser?.realName || currentUser?.username || formatMessage({ id: "common.admin", defaultMessage: "管理员" });

  const handleLogout = () => {
    setToken(null);
    message.success(formatMessage({ id: "navBar.logout.success", defaultMessage: "已安全退出登录" }));
    navigate("/login", { replace: true });
  };

  return {
    ...settings,
    title: APP_NAME,
    logo: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    routeData,
    waterMarkProps: {
      content: `${displayName} (${APP_NAME})`,
    },
    menuItemRender: (item, dom) => (
      <div
        onClick={() => {
          if (item.path) {
            navigate(item.path);
          }
        }}
      >
        {dom}
      </div>
    ),
    actionsRender: () => [
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
      <Tooltip
        key="theme"
        title={
          isDark
            ? formatMessage({ id: "navBar.theme.light", defaultMessage: "切换为浅色模式" })
            : formatMessage({ id: "navBar.theme.dark", defaultMessage: "切换为暗黑模式" })
        }
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={toggleNavTheme}
        >
          {isDark ? <SunOutlined /> : <MoonOutlined />}
        </span>
      </Tooltip>,
      <Tooltip
        key="fullscreen"
        title={
          isFullscreen
            ? formatMessage({ id: "navBar.fullscreen.exit", defaultMessage: "退出全屏" })
            : formatMessage({ id: "navBar.fullscreen.enter", defaultMessage: "全屏模式" })
        }
      >
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
    ],
    avatarProps: {
      src: currentUser?.avatar || "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
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
                      (currentUser?.roles || []).map((r, i) => (
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
    },
    footerRender: () => (
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
    ),
  };
};
