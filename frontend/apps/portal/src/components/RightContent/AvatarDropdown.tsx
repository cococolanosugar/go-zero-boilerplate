import React from "react";
import { Dropdown, Space, Tag } from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  ExportOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { AdminProfileResp } from "@zero/api";
import { useIntl } from "../../contexts/LocaleContext";

export interface AvatarDropdownProps {
  currentUser?: AdminProfileResp | null;
  onOpenProfile: () => void;
  onLogout: () => void;
  children?: React.ReactNode;
}

export const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  currentUser,
  onOpenProfile,
  onLogout,
  children,
}) => {
  const { formatMessage } = useIntl();

  if (!currentUser) return null;

  const isSuperAdmin =
    (currentUser.roles || []).includes("ROLE_ADMIN") ||
    (currentUser.roles || []).includes("admin") ||
    currentUser.id === 1;

  const displayName =
    currentUser.realName ||
    currentUser.username ||
    formatMessage({ id: "portal.header.employee", defaultMessage: "企业员工" });

  const menuItems = [
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
      type: "divider" as const,
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
      onClick: () => window.open("http://localhost:3001", "_blank"),
    },
    {
      type: "divider" as const,
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
  ];

  return (
    <Dropdown menu={{ items: menuItems }}>
      <div
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {children}
      </div>
    </Dropdown>
  );
};

export default AvatarDropdown;