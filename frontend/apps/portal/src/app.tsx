import React from "react";
import { Button, Dropdown, Space, Tag, Tooltip } from "antd";
import {
  DefaultFooter,
  type ProLayoutProps,
  type ProSettings,
} from "@ant-design/pro-components";
import {
  HomeOutlined,
  ClusterOutlined,
  ApiOutlined,
  UserOutlined,
  ExportOutlined,
  LogoutOutlined,
  RocketOutlined,
  GithubOutlined,
  QuestionCircleOutlined,
  SunOutlined,
  MoonOutlined,
  IdcardOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { getAdminProfile, getToken, type AdminProfileResp } from "@zero/api";
import { APP_NAME } from "@zero/shared";
import { LOCALES, type LocaleKey } from "./locales";
import { routes as staticRoutes } from "./config/routes";
import type { PortalInitialState } from "./contexts/InitialStateContext";

const getIcon = (iconName?: React.ReactNode | string) => {
  if (React.isValidElement(iconName)) return iconName;
  switch (iconName) {
    case "HomeOutlined":
      return <HomeOutlined />;
    case "ClusterOutlined":
      return <ClusterOutlined />;
    case "ApiOutlined":
      return <ApiOutlined />;
    default:
      return null;
  }
};

/**
 * 1. 门户全局运行时初始状态拉取（对齐 Ant Design Pro getInitialState 规范）
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

  try {
    const res = await getAdminProfile();
    return {
      currentUser: res,
      isLoggedIn: true,
      loading: false,
    };
  } catch (err) {
    console.warn("未获取到系统员工画像（可能是普通用户或Token失效）:", err);
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
    layout: "top",
    navTheme: isDark ? "realDark" : "light",
    contentWidth: "Fluid",
    fixedHeader: true,
    splitMenus: false,
    colorPrimary: "#722ed1",
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
      <Dropdown
        key="lang"
        menu={{
          selectedKeys: [locale],
          onClick: ({ key }) => setLocale(key as any),
          items: Object.values(LOCALES).map((item) => ({
            key: item.key,
            label: (
              <Space>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Space>
            ),
          })),
        }}
      >
        <span style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}>
          <TranslationOutlined />
        </span>
      </Dropdown>,
      <Tooltip
        key="theme"
        title={
          isDark
            ? formatMessage({
                id: "portal.header.theme.light",
                defaultMessage: "切换为浅色模式",
              })
            : formatMessage({
                id: "portal.header.theme.dark",
                defaultMessage: "切换为暗黑模式",
              })
        }
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <SunOutlined /> : <MoonOutlined />}
        </span>
      </Tooltip>,
      <Tooltip
        key="admin"
        title={formatMessage({
          id: "portal.header.admin.tooltip",
          defaultMessage: "前往企业管理后台系统 (:3001)",
        })}
      >
        <Button
          type="dashed"
          size="small"
          icon={<ExportOutlined />}
          onClick={() => window.open("http://localhost:3001", "_blank")}
        >
          {formatMessage({
            id: "portal.header.admin",
            defaultMessage: "管理后台",
          })}
        </Button>
      </Tooltip>,
      <Tooltip
        key="docs"
        title={formatMessage({
          id: "portal.header.docs",
          defaultMessage: "查看微服务设计指南",
        })}
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() => window.open("https://go-zero.dev", "_blank")}
        >
          <QuestionCircleOutlined />
        </span>
      </Tooltip>,
      <Tooltip
        key="github"
        title={formatMessage({
          id: "portal.header.github",
          defaultMessage: "访问 GitHub 源码大仓",
        })}
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() =>
            window.open("https://github.com/zeromicro/go-zero", "_blank")
          }
        >
          <GithubOutlined />
        </span>
      </Tooltip>,
      !isLoggedIn && (
        <Button
          key="login"
          type="primary"
          shape="round"
          size="small"
          icon={<UserOutlined />}
          style={{ background: "#722ed1", borderColor: "#722ed1" }}
          onClick={onOpenLogin}
        >
          {formatMessage({
            id: "portal.header.login",
            defaultMessage: "登录账号",
          })}
        </Button>
      ),
    ],
    avatarProps: isLoggedIn
      ? {
          src:
            currentUser?.avatar ||
            "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
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
                          <Tag color="gold">
                            {formatMessage({
                              id: "portal.header.superAdmin",
                              defaultMessage: "超管",
                            })}
                          </Tag>
                        ) : (
                          <Tag color="purple">
                            {formatMessage({
                              id: "portal.header.employee",
                              defaultMessage: "员工",
                            })}
                          </Tag>
                        )}
                      </Space>
                    ),
                    disabled: true,
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "profile",
                    icon: <IdcardOutlined />,
                    label: formatMessage({
                      id: "portal.header.profile",
                      defaultMessage: "员工画像与权限",
                    }),
                    onClick: onOpenProfile,
                  },
                  {
                    key: "admin",
                    icon: <ExportOutlined />,
                    label: formatMessage({
                      id: "portal.header.adminLink",
                      defaultMessage: "进入管理后台 (:3001)",
                    }),
                    onClick: () =>
                      window.open("http://localhost:3001", "_blank"),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: formatMessage({
                      id: "portal.header.logout",
                      defaultMessage: "退出登录",
                    }),
                    danger: true,
                    onClick: onLogout,
                  },
                ],
              }}
            >
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {dom}
              </div>
            </Dropdown>
          ),
        }
      : undefined,
    footerRender: () => (
      <DefaultFooter
        copyright={`2026 ${APP_NAME} ${formatMessage({
          id: "portal.footer.copyright",
          defaultMessage: "工业级微服务门户体系",
        })}`}
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
            key: "admin",
            title: "管理后台 (:3001)",
            href: "http://localhost:3001",
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
