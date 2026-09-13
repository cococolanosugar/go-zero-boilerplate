import React from "react";
import {
  type ProLayoutProps,
  type ProSettings,
} from "@ant-design/pro-components";
import { Footer, RightContentActions, AvatarDropdown } from "./components";
import {
  HomeOutlined,
  ClusterOutlined,
  ApiOutlined,
  RocketOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import {
  setErrorHandler,
  setUnauthorizedHandler,
  addRequestInterceptor,
  getAdminProfile,
  getToken,
  type AdminProfileResp,
} from "@zero/api";
import { APP_NAME } from "@zero/shared";
import { type LocaleKey } from "./locales";
import { routes as staticRoutes } from "./config/routes";
import { defaultSettings } from "./config/defaultSettings";
import type { PortalInitialState } from "./contexts/InitialStateContext";
import { portalErrorHandler, portalRequestErrorConfig } from "./requestErrorConfig";

// 注册门户网络错误与 401 未登录拦截配置（免刷新唤起弹窗，防 404 路由雪崩）
setErrorHandler(portalErrorHandler);
setUnauthorizedHandler(() => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("portal:open-login", { detail: { reason: "unauthorized" } })
    );
  }
});
if (portalRequestErrorConfig.requestInterceptors) {
  portalRequestErrorConfig.requestInterceptors.forEach(addRequestInterceptor);
}

export const request = portalRequestErrorConfig;

const getIcon = (iconName?: React.ReactNode | string) => {
  if (React.isValidElement(iconName)) return iconName;
  switch (iconName) {
    case "HomeOutlined":
      return <HomeOutlined />;
    case "ClusterOutlined":
      return <ClusterOutlined />;
    case "ApiOutlined":
      return <ApiOutlined />;
    case "CompassOutlined":
      return <CompassOutlined />;
    default:
      return null;
  }
};

/**
 * 1. 门户全局运行时初始状态拉取（对齐 Ant Design Pro getInitialState 规范）
 * 支持员工账号 (SysUser) 与消费者账号 (MobileUser) 双模态身份维持
 */
export async function getInitialState(): Promise<PortalInitialState> {
  const token = getToken();
  if (!token) {
    return {
      currentUser: null,
      isLoggedIn: false,
      loading: false,
    };
  }

  const loginType =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("portal_login_type")
      : null;

  try {
    if (loginType === "mobile") {
      const cached =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("portal_mobile_user")
          : null;
      const parsed = cached ? JSON.parse(cached) : null;
      return {
        currentUser: parsed || {
          id: 0,
          username: "普通业务用户",
          realName: "普通业务用户",
          roles: ["ROLE_USER"],
          permissions: [],
        },
        isLoggedIn: true,
        loading: false,
      };
    }

    const res = await getAdminProfile();
    return {
      currentUser: res,
      isLoggedIn: true,
      loading: false,
    };
  } catch (err) {
    console.warn("未获取到系统员工画像（可能是普通业务用户或Token失效）:", err);
    return {
      currentUser: null,
      isLoggedIn: false,
      loading: false,
    };
  }
}

export interface RuntimePortalLayoutContext {
  initialState: PortalInitialState;
  setInitialState: React.Dispatch<React.SetStateAction<PortalInitialState>>;
  navigate: (to: string, options?: any) => void;
  formatMessage: (descriptor: { id: string; defaultMessage?: string }) => string;
  message: any;
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

/**
 * 2. 门户运行时布局配置导出（对齐 Ant Design Pro layout 运行时规范）
 * 统筹管理顶部操作栏、语言切换、主题切换、用户画像/退出菜单与页脚
 */
export const layout = (
  ctx: RuntimePortalLayoutContext
): ProLayoutProps & { routeData: any } => {
  const {
    initialState,
    navigate,
    formatMessage,
    locale,
    setLocale,
    isDark,
    setIsDark,
    onOpenLogin,
    onOpenProfile,
    onLogout,
  } = ctx;

  const { currentUser, isLoggedIn } = initialState;

  const mainRoutes =
    staticRoutes.find((r) => r.path === "/" && r.layout === true)?.routes || [];
  const routeData = {
    path: "/",
    routes: mainRoutes
      .filter((r) => !r.hideInMenu && r.name)
      .map((r) => ({
        path: r.path,
        name: formatMessage({
          id: r.locale || `menu.${r.path.replace(/^\//, "")}`,
          defaultMessage: r.name,
        }),
        icon: getIcon(r.icon),
      })),
  };

  const isSuperAdmin =
    (currentUser?.roles || []).includes("ROLE_ADMIN") ||
    (currentUser?.roles || []).includes("admin") ||
    currentUser?.id === 1;

  const displayName =
    currentUser?.realName ||
    currentUser?.username ||
    formatMessage({ id: "portal.header.employee", defaultMessage: "企业员工" });

  const proSettings: ProSettings = {
    ...defaultSettings,
    navTheme: isDark ? "realDark" : "light",
  };

  return {
    ...proSettings,
    title: `${APP_NAME} ${formatMessage({
      id: "home.hero.title",
      defaultMessage: "官方技术门户",
    })}`,
    logo: <RocketOutlined style={{ fontSize: 22, color: "#722ed1" }} />,
    routeData,
    waterMarkProps: {
      content: isLoggedIn ? `${displayName} (${APP_NAME})` : APP_NAME,
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
      <RightContentActions
        key="actions"
        isLoggedIn={!!isLoggedIn}
        onOpenLogin={onOpenLogin}
      />,
    ],
    avatarProps: isLoggedIn
      ? {
          src:
            currentUser?.avatar ||
            "/favicon.svg",
          title: displayName,
          render: (_props, dom) => (
            <AvatarDropdown
              currentUser={currentUser}
              onOpenProfile={onOpenProfile}
              onLogout={onLogout}
            >
              {dom}
            </AvatarDropdown>
          ),
        }
      : undefined,
    footerRender: () => <Footer />,
  };
};
