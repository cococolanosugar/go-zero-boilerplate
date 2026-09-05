import React, { useState, useEffect } from "react";
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
} from "@ant-design/icons";
import { getUserInfo, setToken, type UserInfoResp } from "@zero/api";
import { APP_NAME } from "@zero/shared";
import { useLayoutSettings } from "../contexts/LayoutSettingsContext";

const routeConfig = {
  path: "/",
  routes: [
    {
      path: "/dashboard",
      name: "监控大盘",
      icon: <DashboardOutlined />,
    },
    {
      path: "/orders",
      name: "订单管理",
      icon: <ShoppingCartOutlined />,
    },
    {
      path: "/users",
      name: "用户中心",
      icon: <UserOutlined />,
    },
  ],
};

export const BasicLayout: React.FC = () => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, setSettings, toggleNavTheme, isDark } = useLayoutSettings();
  const [currentUser, setCurrentUser] = useState<UserInfoResp | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    getUserInfo()
      .then((user) => setCurrentUser(user))
      .catch((err) => {
        console.error("加载用户信息失败:", err);
      });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleLogout = () => {
    setToken(null);
    message.success("已安全退出登录");
    navigate("/login", { replace: true });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div style={{ height: "100vh" }}>
      <ProLayout
        {...settings}
        title={APP_NAME}
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        route={routeConfig}
        location={{ pathname: location.pathname }}
        waterMarkProps={{
          content: currentUser?.name ? `${currentUser.name} (${APP_NAME})` : APP_NAME,
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
              onClick={toggleNavTheme}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </span>
          </Tooltip>,
          <Tooltip key="fullscreen" title={isFullscreen ? "退出全屏" : "全屏模式"}>
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </span>
          </Tooltip>,
          <Tooltip key="portal" title="前往官方前台门户系统 (:3000)">
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("http://localhost:3000", "_blank")}
            >
              <GlobalOutlined />
            </span>
          </Tooltip>,
          <Tooltip key="help" title="查看微服务文档与使用指南">
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("https://go-zero.dev", "_blank")}
            >
              <QuestionCircleOutlined />
            </span>
          </Tooltip>,
          <Tooltip key="github" title="查看 GitHub 仓库">
            <span
              style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
              onClick={() => window.open("https://github.com/zeromicro/go-zero", "_blank")}
            >
              <GithubOutlined />
            </span>
          </Tooltip>,
        ]}
        avatarProps={{
          src: currentUser?.avatar || "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
          title: currentUser?.name || "管理员",
          render: (_props, dom) => (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "user",
                    label: (
                      <Space>
                        <UserOutlined />
                        <span>{currentUser?.name || "管理员"}</span>
                        <Tag color="blue">Admin</Tag>
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
                    label: "退出登录",
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