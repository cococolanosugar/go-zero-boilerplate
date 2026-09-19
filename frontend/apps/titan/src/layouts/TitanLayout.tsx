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
} from "antd";
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
import { Select } from "antd";
import { ProLayout } from "@ant-design/pro-components";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { useLocale, useIntl } from "../contexts/LocaleContext";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";
import { LOCALES, type LocaleKey } from "../locales";
import { routes as routeConfig } from "../config/routes";
import type { AppRouteItem } from "../config/routes.types";
import { defaultSettings } from "../config/defaultSettings";
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
  const { projects, currentProjectId, currentProject, setCurrentProjectId, loading: projectLoading } = useProject();
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const { formatMessage: t } = useIntl();
  const { isDark, setIsDark } = useLayoutSettings();

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
        actionsRender={() => [
          <Button
            key="projectSwitcherBtn"
            type="dashed"
            icon={<ProjectOutlined style={{ color: "#1890ff" }} />}
            onClick={() => setProjectDrawerOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 6,
              height: 32,
              padding: "0 12px",
            }}
          >
            <span style={{ fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentProject?.displayName || currentProject?.name || t({ id: "titan.header.selectProject", defaultMessage: "选择交付项目" })}
            </span>
            <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>
              切换
            </Tag>
          </Button>,
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
          <Tooltip key="theme" title={isDark
            ? t({ id: "titan.header.themeLight", defaultMessage: "切换为浅色" })
            : t({ id: "titan.header.themeDark", defaultMessage: "切换为暗黑" })}
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
            <Button type="text" icon={<GlobalOutlined />}>
              {LOCALES[locale]?.label || t({ id: "titan.header.language", defaultMessage: "语言" })}
            </Button>
          </Dropdown>,
        ]}
        avatarProps={{
          icon: <UserOutlined />,
          title: profile?.realName || profile?.username || t({ id: "titan.header.defaultRole", defaultMessage: "开发工程师" }),
          size: "small",
          render: (_props, dom) => {
            return (
              <Dropdown
                menu={{
                  items: [
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
                    { type: "divider" },
                    {
                      key: "logout",
                      icon: <LogoutOutlined />,
                      danger: true,
                      label: t({ id: "titan.header.logout", defaultMessage: "退出登录" }),
                      onClick: handleLogout,
                    },
                  ],
                }}
              >
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
        <WorkspaceTabs />
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
