import React from "react";
import { Dropdown, Space, Tag, Avatar, App } from "antd";
import { UserOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { setToken, type AdminProfileResp } from "@zero/api";
import { useInitialState } from "../../contexts/InitialStateContext";
import { useIntl } from "../../contexts/LocaleContext";

export interface AvatarDropdownProps {
  currentUser?: AdminProfileResp | null;
  isSuperAdmin?: boolean;
  onLogout?: () => void;
  navigate?: (path: string, options?: any) => void;
  dom?: React.ReactNode;
}

export const AvatarDropdown: React.FC<AvatarDropdownProps> = (props) => {
  const { initialState } = useInitialState();
  const { formatMessage } = useIntl();
  const { message } = App.useApp();
  const routerNavigate = useNavigate();

  const navigate = props.navigate || routerNavigate;
  const currentUser = props.currentUser !== undefined ? props.currentUser : initialState.currentUser;
  const isSuperAdmin = props.isSuperAdmin !== undefined ? props.isSuperAdmin : initialState.isSuperAdmin;

  const displayName =
    currentUser?.realName ||
    currentUser?.username ||
    formatMessage({ id: "common.admin", defaultMessage: "管理员" });

  const avatarUrl =
    currentUser?.avatar || "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg";

  const handleLogout = () => {
    if (props.onLogout) {
      props.onLogout();
      return;
    }
    setToken(null);
    message.success(
      formatMessage({ id: "navBar.logout.success", defaultMessage: "已安全退出登录" })
    );
    navigate("/login", { replace: true });
  };

  const handleSettings = () => {
    navigate("/account/settings");
  };

  const menuItems = [
    {
      key: "user",
      label: (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 500 }}>{displayName}</span>
          {isSuperAdmin ? (
            <Tag color="gold">
              {formatMessage({ id: "role.superAdmin", defaultMessage: "超级管理员" })}
            </Tag>
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
      type: "divider" as const,
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: formatMessage({ id: "navBar.settings", defaultMessage: "个人设置" }),
      onClick: handleSettings,
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: formatMessage({ id: "navBar.logout", defaultMessage: "退出登录" }),
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }}>
      <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        {props.dom || (
          <Space size={8}>
            <Avatar size="small" src={avatarUrl} icon={<UserOutlined />} />
            <span>{displayName}</span>
          </Space>
        )}
      </div>
    </Dropdown>
  );
};

export default AvatarDropdown;
