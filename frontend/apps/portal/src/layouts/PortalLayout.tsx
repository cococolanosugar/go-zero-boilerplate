import React, { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { App as AntdApp, Button, Dropdown, Space, Tag, Tooltip } from "antd";
import {
  ProLayout,
  DefaultFooter,
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
} from "@ant-design/icons";
import { APP_NAME } from "@zero/shared";
import { useAuth } from "../contexts/AuthContext";
import { LoginModal } from "../components/LoginModal";
import { ProfileDrawer } from "../components/ProfileDrawer";

export const PortalLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isLoggedIn, logout } = useAuth();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const routeConfig = {
    path: "/",
    routes: [
      {
        path: "/home",
        name: "门户首页",
        icon: <HomeOutlined />,
      },
      {
        path: "/services",
        name: "微服务治理",
        icon: <ClusterOutlined />,
      },
      {
        path: "/workbench",
        name: "联调工作台",
        icon: <ApiOutlined />,
      },
    ],
  };

  const handleLogout = () => {
    logout();
    message.success("已安全退出登录");
  };

  const isSuperAdmin =
    (profile?.roles || []).includes("ROLE_ADMIN") ||
    (profile?.roles || []).includes("admin");

  const displayName = profile?.realName || profile?.username || "企业员工";

  const proSettings: ProSettings = {
    layout: "top",
    navTheme: isDark ? "realDark" : "light",
    contentWidth: "Fluid",
    fixedHeader: true,
    splitMenus: false,
    colorPrimary: "#722ed1",
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <ProLayout
        {...proSettings}
        title={`${APP_NAME} 技术门户`}
        logo={<RocketOutlined style={{ fontSize: 22, color: "#722ed1" }} />}
        route={routeConfig}
        location={{ pathname: location.pathname }}
        waterMarkProps={{
          content: isLoggedIn ? `${displayName} (${APP_NAME})` : APP_NAME,
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
          <Tooltip key="theme" title={isDark ? "切换为浅色模式" : "切换为暗黑模式"}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </span>
          </Tooltip>,
          <Tooltip key="admin" title="前往企业管理后台系统 (:3001)">
            <Button
              type="dashed"
              size="small"
              icon={<ExportOutlined />}
              onClick={() => window.open("http://localhost:3001", "_blank")}
            >
              管理后台
            </Button>
          </Tooltip>,
          <Tooltip key="docs" title="查看微服务设计指南">
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("https://go-zero.dev", "_blank")}
            >
              <QuestionCircleOutlined />
            </span>
          </Tooltip>,
          <Tooltip key="github" title="访问 GitHub 源码大仓">
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
              onClick={() => setLoginModalOpen(true)}
            >
              登录账号
            </Button>
          ),
        ]}
        avatarProps={
          isLoggedIn
            ? {
                src:
                  profile?.avatar ||
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
                                <Tag color="gold">超管</Tag>
                              ) : (
                                <Tag color="purple">员工</Tag>
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
                          label: "员工画像与权限",
                          onClick: () => setProfileDrawerOpen(true),
                        },
                        {
                          key: "admin",
                          icon: <ExportOutlined />,
                          label: "进入管理后台 (:3001)",
                          onClick: () =>
                            window.open("http://localhost:3001", "_blank"),
                        },
                        {
                          type: "divider",
                        },
                        {
                          key: "logout",
                          icon: <LogoutOutlined />,
                          label: "退出登录",
                          danger: true,
                          onClick: handleLogout,
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
            : undefined
        }
        footerRender={() => (
          <DefaultFooter
            copyright={`2026 ${APP_NAME} 工业级微服务门户体系`}
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
        )}
      >
        <div style={{ padding: "24px 16px" }}>
          <Outlet context={{ onOpenLogin: () => setLoginModalOpen(true) }} />
        </div>
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
