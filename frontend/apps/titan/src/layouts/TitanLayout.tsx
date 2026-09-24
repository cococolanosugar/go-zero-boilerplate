import React, { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  App as AntdApp,
  Space,
  Dropdown,
  Avatar,
  Tag,
  Tooltip,
  Button,
  Grid,
} from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  HomeOutlined,
  SettingOutlined,
  LinkOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  TagOutlined,
  BranchesOutlined,
  RocketOutlined,
  ClusterOutlined,
  ApiOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-components";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { useLocale, useIntl } from "../contexts/LocaleContext";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";
import { LOCALES, type LocaleKey } from "../locales";
import { routes as routeConfig } from "../config/routes";
import type { AppRouteItem } from "../config/routes.types";
import { ProjectSwitcherDrawer } from "../components/ProjectSwitcherDrawer";
import { WorkspaceTabs } from "../components/WorkspaceTabs";

// routes.ts 中声明的 icon 名称 → 视图层图标组件映射
const MENU_ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  DeploymentUnitOutlined: <DeploymentUnitOutlined />,
  ProjectOutlined: <ProjectOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  CloudServerOutlined: <CloudServerOutlined />,
  TagOutlined: <TagOutlined />,
  BranchesOutlined: <BranchesOutlined />,
  RocketOutlined: <RocketOutlined />,
  ClusterOutlined: <ClusterOutlined />,
  ApiOutlined: <ApiOutlined />,
  AuditOutlined: <AuditOutlined />,
};

interface MenuItem {
  path: string;
  name: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

export const TitanLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { currentProject } = useProject();
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const { formatMessage: t } = useIntl();
  const { isDark, setIsDark } = useLayoutSettings();

  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md !== "undefined" ? !screens.md : false;

  const handleLogout = () => {
    logout();
    message.success(t({ id: "titan.header.logoutSuccess", defaultMessage: "已安全退出登录" }));
    navigate("/login", { replace: true });
  };

  // 从 routes.ts 的 locale 元数据驱动菜单：locale/name 字段即三语资源 key
  const buildMenuItems = (items: AppRouteItem[] | undefined): MenuItem[] =>
    (items || [])
      .filter((route) => route.hideInMenu !== true && Boolean(route.locale || route.name))
      .map((route) => ({
        path: route.path,
        name: t({ id: route.locale || route.name || "", defaultMessage: route.locale || route.name || "" }),
        icon: route.icon ? MENU_ICON_MAP[route.icon] : undefined,
        children: route.routes ? buildMenuItems(route.routes) : undefined,
      }));

  const layoutRoot = routeConfig.find((r) => r.layout === true);
  const menuData = buildMenuItems(layoutRoot?.routes);

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

  const avatarMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      disabled: true,
      label: (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{profile?.realName || profile?.username || t({ id: "titan.header.defaultRole", defaultMessage: "开发工程师" })}</div>
            <Tag color="blue" style={{ marginTop: 4 }}>
              {profile?.roles?.[0] || "DEVELOPER"}
            </Tag>
          </div>
        </Space>
      ),
    },
    ...(isMobile
      ? [
          { type: "divider" as const },
          {
            key: "portal",
            icon: <HomeOutlined />,
            label: t({ id: "titan.header.portal", defaultMessage: "技术门户 (:3000)" }),
            onClick: () => window.open(`http://${host}:3000`, "_blank"),
          },
          {
            key: "admin",
            icon: <SettingOutlined />,
            label: t({ id: "titan.header.admin", defaultMessage: "管理后台 (:3001)" }),
            onClick: () => window.open(`http://${host}:3001`, "_blank"),
          },
        ]
      : []),
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: t({ id: "titan.header.logout", defaultMessage: "退出登录" }),
      onClick: handleLogout,
    },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <ProLayout
        title={t({ id: "titan.title", defaultMessage: "Titan 研发交付平台" })}
        logo="/favicon.svg"
        navTheme={isDark ? "realDark" : "light"}
        layout="mix"
        contentWidth="Fluid"
        fixedHeader
        fixSiderbar
        location={{ pathname: location.pathname }}
        footerRender={() => (
          <div style={{ textAlign: "center", color: "#8c8c8c", fontSize: 12 }}>
            {t({ id: "titan.footer.copyright", defaultMessage: "Titan 云原生研发交付与 CI/CD 引擎" })}
          </div>
        )}
        menuItemRender={(item, dom) => (
          <div
            onClick={() => {
              if (item.path && (!item.children || item.children.length === 0)) {
                navigate(item.path);
              }
            }}
          >
            {dom}
          </div>
        )}
        menuDataRender={() => menuData}
        actionsRender={() => {
          const actions: React.ReactNode[] = [
            <Tooltip
              key="projectSwitcherBtn"
              title={currentProject?.displayName || currentProject?.name || t({ id: "titan.header.selectProject", defaultMessage: "选择交付项目" })}
            >
              <Button
                type="dashed"
                icon={<ProjectOutlined style={{ color: "#1890ff" }} />}
                onClick={() => setProjectDrawerOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 0 : 6,
                  borderRadius: 6,
                  height: 32,
                  padding: isMobile ? "0 8px" : "0 12px",
                }}
              >
                {!isMobile && (
                  <>
                    <span style={{ fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentProject?.displayName || currentProject?.name || t({ id: "titan.header.selectProject", defaultMessage: "选择交付项目" })}
                    </span>
                    <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>
                      切换
                    </Tag>
                  </>
                )}
              </Button>
            </Tooltip>,
          ];

          if (!isMobile) {
            actions.push(
              <Tooltip key="portal" title={t({ id: "titan.header.portalTooltip", defaultMessage: "返回官方技术门户 (:3000)" })}>
                <Button
                  type="text"
                  icon={<HomeOutlined />}
                  onClick={() => window.open(`http://${host}:3000`, "_blank")}
                >
                  {t({ id: "titan.header.portal", defaultMessage: "技术门户" })}
                </Button>
              </Tooltip>,
              <Tooltip key="admin" title={t({ id: "titan.header.adminTooltip", defaultMessage: "前往企业管理后台 (:3001)" })}>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => window.open(`http://${host}:3001`, "_blank")}
                >
                  {t({ id: "titan.header.admin", defaultMessage: "管理后台" })}
                </Button>
              </Tooltip>,
            );
          }

          actions.push(
            <Tooltip
              key="theme"
              title={
                isDark
                  ? t({ id: "titan.header.themeLight", defaultMessage: "切换为浅色" })
                  : t({ id: "titan.header.themeDark", defaultMessage: "切换为暗黑" })
              }
            >
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={() => setIsDark(!isDark)}
              />
            </Tooltip>,
            <Dropdown
              key="locale"
              menu={{
                selectedKeys: [locale],
                items: Object.values(LOCALES).map((loc) => ({
                  key: loc.key,
                  label: `${loc.icon} ${loc.label}`,
                })),
                onClick: ({ key }) => setLocale(key as LocaleKey),
              }}
            >
              <Tooltip title={LOCALES[locale]?.label || t({ id: "titan.header.language", defaultMessage: "语言" })}>
                <Button type="text" icon={<GlobalOutlined />}>
                  {!isMobile && (LOCALES[locale]?.label || t({ id: "titan.header.language", defaultMessage: "语言" }))}
                </Button>
              </Tooltip>
            </Dropdown>,
          );

          return actions;
        }}
        avatarProps={{
          icon: <UserOutlined />,
          title: profile?.realName || profile?.username || t({ id: "titan.header.defaultRole", defaultMessage: "开发工程师" }),
          size: "small",
          render: (_props, dom) => {
            return (
              <Dropdown menu={{ items: avatarMenuItems }}>
                <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {dom}
                </div>
              </Dropdown>
            );
          },
        }}
        links={[
          <a key="openapi" href={`http://${host}:8888/openapi`} target="_blank" rel="noreferrer">
            <LinkOutlined /> <span>{t({ id: "titan.header.docs", defaultMessage: "OpenAPI 文档" })}</span>
          </a>,
        ]}
      >
        {!isMobile && <WorkspaceTabs />}
        <Outlet />
        <ProjectSwitcherDrawer
          open={projectDrawerOpen}
          onClose={() => setProjectDrawerOpen(false)}
        />
      </ProLayout>
    </div>
  );
};

export default TitanLayout;
