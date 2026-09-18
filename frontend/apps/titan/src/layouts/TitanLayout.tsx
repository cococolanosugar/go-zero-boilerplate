import React from "react";
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
  DashboardOutlined,
  BranchesOutlined,
  ClusterOutlined,
  ApiOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  HomeOutlined,
  SettingOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-components";
import { useAuth } from "../contexts/AuthContext";
import { useLocale, useIntl } from "../contexts/LocaleContext";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";
import { LOCALES, type LocaleKey } from "../locales";
import { defaultSettings } from "../config/defaultSettings";

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  BranchesOutlined: <BranchesOutlined />,
  ClusterOutlined: <ClusterOutlined />,
  ApiOutlined: <ApiOutlined />,
};

export const TitanLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const { formatMessage } = useIntl();
  const { isDark, setIsDark } = useLayoutSettings();

  const handleLogout = () => {
    logout();
    message.success(formatMessage({ id: "titan.header.logoutSuccess", defaultMessage: "已安全退出登录" }));
    navigate("/login", { replace: true });
  };

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

  return (
    <div style={{ minHeight: "100vh" }}>
      <ProLayout
        title="Titan 研发交付"
        logo="/favicon.svg"
        navTheme={isDark ? "realDark" : "light"}
        layout="mix"
        contentWidth="Fluid"
        fixedHeader
        fixSiderbar
        location={{ pathname: location.pathname }}
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
        menuDataRender={() => [
          {
            path: "/dashboard",
            name: formatMessage({ id: "menu.dashboard", defaultMessage: "研发大盘" }),
            icon: iconMap.DashboardOutlined,
          },
          {
            path: "/pipelines",
            name: formatMessage({ id: "menu.pipelines", defaultMessage: "流水线中心" }),
            icon: iconMap.BranchesOutlined,
          },
          {
            path: "/clusters",
            name: formatMessage({ id: "menu.clusters", defaultMessage: "多集群治理" }),
            icon: iconMap.ClusterOutlined,
          },
          {
            path: "/integrations",
            name: formatMessage({ id: "menu.integrations", defaultMessage: "凭据与集成" }),
            icon: iconMap.ApiOutlined,
          },
        ]}
        actionsRender={() => [
          <Tooltip key="portal" title="返回官方技术门户 (:3000)">
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => window.open(`http://${host}:3000`, "_blank")}
            >
              技术门户
            </Button>
          </Tooltip>,
          <Tooltip key="admin" title="前往企业管理后台 (:3001)">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => window.open(`http://${host}:3001`, "_blank")}
            >
              管理后台
            </Button>
          </Tooltip>,
          <Tooltip key="theme" title={isDark ? "切换为浅色" : "切换为暗黑"}>
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
              {LOCALES[locale]?.label || "语言"}
            </Button>
          </Dropdown>,
        ]}
        avatarProps={{
          icon: <UserOutlined />,
          title: profile?.realName || profile?.username || "开发工程师",
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
                            <div>{profile?.realName || profile?.username || "DevOps Engineer"}</div>
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
                      label: formatMessage({ id: "titan.header.logout", defaultMessage: "退出登录" }),
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
            <LinkOutlined /> <span>OpenAPI 规范</span>
          </a>,
        ]}
      >
        <Outlet />
      </ProLayout>
    </div>
  );
};

export default TitanLayout;
