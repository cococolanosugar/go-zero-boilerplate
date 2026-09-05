import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { App as AntdApp, Dropdown, Space, Avatar, Tag } from "antd";
import { ProLayout } from "@ant-design/pro-components";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { getUserInfo, setToken, type UserInfoResp } from "@zero/api";
import { APP_NAME } from "@zero/shared";

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
  const [currentUser, setCurrentUser] = useState<UserInfoResp | null>(null);

  useEffect(() => {
    // 加载当前登录用户信息
    getUserInfo({ id: 1 })
      .then((user) => setCurrentUser(user))
      .catch((err) => {
        console.error("加载用户信息失败:", err);
      });
  }, []);

  const handleLogout = () => {
    setToken(null);
    message.success("已安全退出登录");
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ height: "100vh" }}>
      <ProLayout
        title={APP_NAME}
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        route={routeConfig}
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
        avatarProps={{
          src: currentUser?.avatar || "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
          title: currentUser?.name || "管理员",
          render: (_props, dom) => {
            return (
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
            );
          },
        }}
      >
        <Outlet />
      </ProLayout>
    </div>
  );
};

export default BasicLayout;