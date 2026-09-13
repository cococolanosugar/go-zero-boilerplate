import React from "react";
import {
  type ProLayoutProps,
  type ProSettings,
} from "@ant-design/pro-components";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
  ApiOutlined,
  BookOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  FormOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  IdcardOutlined,
  BellOutlined,
  TeamOutlined,
  FundProjectionScreenOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  setErrorHandler,
  addRequestInterceptor,
  getAdminProfile,
  getToken,
  type SysMenuItem,
} from "@zero/api";
import { APP_NAME } from "@zero/shared";
import { type LocaleKey } from "./locales";
import { defaultSettings, type DefaultSettings } from "./config/defaultSettings";
import { RightContentActions, AvatarDropdown } from "./components/RightContent";
import { Footer } from "./components/Footer";
import { routes as staticRoutes } from "./config/routes";
import type { AppRouteItem } from "./config/routes.types";
import { getAccess } from "./access";
import type { InitialState } from "./contexts/InitialStateContext";
import { errorHandler, requestErrorConfig } from "./requestErrorConfig";

// 注册 Ant Design Pro 统一网络与错误拦截配置
setErrorHandler(errorHandler);
if (requestErrorConfig.requestInterceptors) {
  requestErrorConfig.requestInterceptors.forEach(addRequestInterceptor);
}

export const request = requestErrorConfig;

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
    case "FormOutlined":
      return <FormOutlined />;
    case "ProfileOutlined":
      return <ProfileOutlined />;
    case "CheckCircleOutlined":
      return <CheckCircleOutlined />;
    case "ApartmentOutlined":
      return <ApartmentOutlined />;
    case "IdcardOutlined":
      return <IdcardOutlined />;
    case "BellOutlined":
      return <BellOutlined />;
    case "TeamOutlined":
      return <TeamOutlined />;
    case "FundProjectionScreenOutlined":
      return <FundProjectionScreenOutlined />;
    case "FileTextOutlined":
      return <FileTextOutlined />;
    default:
      return <AppstoreOutlined />;
  }
};

const getMenuLocaleKey = (path: string) => {
  const map: Record<string, string> = {
    "/dashboard": "menu.dashboard",
    "/workplace": "menu.workplace",
    "/form/step-form": "menu.form.stepform",
    "/profile/advanced": "menu.profile.advanced",
    "/result/success": "menu.result.success",
    "/orders": "menu.orders",
    "/users": "menu.users",
    "/monitor": "menu.monitor",
    "/permission": "menu.permission",
    "/permission/dept": "menu.permission.dept",
    "/permission/sys-post": "menu.permission.syspost",
    "/permission/users": "menu.permission.users",
    "/permission/roles": "menu.permission.roles",
    "/permission/menus": "menu.permission.menus",
    "/system": "menu.system",
    "/system/dept": "menu.system.dept",
    "/system/users": "menu.system.users",
    "/system/roles": "menu.system.roles",
    "/system/menus": "menu.system.menus",
    "/system/apis": "menu.system.apis",
    "/system/dicts": "menu.system.dicts",
    "/system/logs": "menu.system.logs",
    "/system/sys-post": "menu.system.syspost",
    "/system/sys-notice": "menu.system.sysnotice",
    "/system/config": "menu.system.config",
    "/system/online": "menu.system.online",
    "/system/openapi": "menu.system.openapi",
    "/monitor/online": "menu.monitor.online",
    "/monitor/logs": "menu.monitor.logs",
    "/monitor/openapi": "menu.monitor.openapi",
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
  settings: Partial<DefaultSettings>;
  setSettings: (settings: Partial<DefaultSettings>) => void;
  toggleNavTheme: () => void;
  isDark: boolean;
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

/**
 * 2. 运行时布局配置导出（对齐 Ant Design Pro layout 运行时规范）
 * 统筹管理统一品牌默认配置、导航右侧动作区与动态菜单路由
 */
export const layout = (ctx: RuntimeLayoutContext): ProLayoutProps & { routeData: any } => {
  const {
    initialState,
    navigate,
    formatMessage,
    settings,
    toggleNavTheme,
    isDark,
    isFullscreen,
    toggleFullscreen,
  } = ctx;

  const { currentUser, menus } = initialState;
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

  return {
    ...defaultSettings,
    ...settings,
    title: APP_NAME,
    routeData,
    waterMarkProps:
      settings.watermark !== false
        ? {
            content: [
              `${displayName} (@${currentUser?.username || "admin"})`,
              `${APP_NAME} · 内部机密 严禁外传`,
            ],
            font: {
              color: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)",
              fontSize: 14,
            },
            gap: [140, 140],
            rotate: -22,
          }
        : undefined,
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
      <RightContentActions
        key="right-actions"
        isDark={isDark}
        toggleNavTheme={toggleNavTheme}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />,
    ],
    avatarProps: {
      src: currentUser?.avatar || defaultSettings.logo,
      title: displayName,
      render: (_props, dom) => <AvatarDropdown dom={dom} />,
    },
    footerRender: () => <Footer />,
  };
};
