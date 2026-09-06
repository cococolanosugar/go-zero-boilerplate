import React from "react";
import { Drawer, Avatar, Space, Tag, Divider, Button, Card, Typography } from "antd";
import {
  UserOutlined,
  SafetyCertificateOutlined,
  ExportOutlined,
  MailOutlined,
  PhoneOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { ProDescriptions } from "@ant-design/pro-components";
import { useAuth } from "../contexts/AuthContext";
import { useIntl } from "../contexts/LocaleContext";

const { Title, Text } = Typography;

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const { profile, logout } = useAuth();
  const { formatMessage } = useIntl();

  if (!profile) return null;

  const isSuperAdmin =
    (profile.roles || []).includes("ROLE_ADMIN") ||
    (profile.roles || []).includes("admin");

  return (
    <Drawer
      title={formatMessage({
        id: "profile.drawer.title",
        defaultMessage: "企业员工画像与系统权限",
      })}
      open={open}
      onClose={onClose}
      size={500}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={() => window.open("http://localhost:3001", "_blank")}
          >
            {formatMessage({
              id: "profile.enterAdmin",
              defaultMessage: "进入后台系统",
            })}
          </Button>
        </Space>
      }
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Avatar
          size={72}
          src={profile.avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#722ed1", marginBottom: 12 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          {profile.realName || profile.username}
        </Title>
        <Text type="secondary">@{profile.username}</Text>
        <div style={{ marginTop: 8 }}>
          {isSuperAdmin ? (
            <Tag color="gold">
              {formatMessage({
                id: "profile.superAdmin",
                defaultMessage: "超级管理员 (Super Admin)",
              })}
            </Tag>
          ) : (
            (profile.roles || []).map((r, idx) => (
              <Tag key={idx} color="purple">
                {r}
              </Tag>
            ))
          )}
        </div>
      </div>

      <Card variant="borderless" style={{ background: "#fcf9ff", marginBottom: 20 }}>
        <ProDescriptions
          column={1}
          title={formatMessage({
            id: "profile.basicInfo",
            defaultMessage: "账号基础信息",
          })}
        >
          <ProDescriptions.Item
            label={
              <Space>
                <ApartmentOutlined />
                <span>
                  {formatMessage({
                    id: "profile.dept",
                    defaultMessage: "所属部门",
                  })}
                </span>
              </Space>
            }
          >
            <Tag color="geekblue">{profile.deptName || "总部默认部门"}</Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={
              <Space>
                <PhoneOutlined />
                <span>
                  {formatMessage({
                    id: "profile.mobile",
                    defaultMessage: "绑定手机",
                  })}
                </span>
              </Space>
            }
          >
            {profile.mobile || "未绑定"}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={
              <Space>
                <MailOutlined />
                <span>
                  {formatMessage({
                    id: "profile.email",
                    defaultMessage: "企业邮箱",
                  })}
                </span>
              </Space>
            }
          >
            {profile.email || "未绑定"}
          </ProDescriptions.Item>
        </ProDescriptions>
      </Card>

      <Card variant="borderless" style={{ background: "#fafafa" }}>
        <div style={{ marginBottom: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: "#722ed1" }} />
          <span>
            {formatMessage({
              id: "profile.permissions",
              defaultMessage: "拥有的按钮与接口权限点",
            })}{" "}
            ({profile.permissions?.length || 0})
          </span>
        </div>
        {profile.permissions && profile.permissions.length > 0 ? (
          <Space wrap size={[6, 8]}>
            {profile.permissions.map((p, idx) => (
              <Tag key={idx} color="purple">
                {p}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">
            {formatMessage({
              id: "profile.noPermissions",
              defaultMessage: "暂无独立细粒度权限编码",
            })}
          </Text>
        )}
      </Card>

      <Divider style={{ margin: "24px 0" }} />

      <Button
        block
        danger
        onClick={() => {
          logout();
          onClose();
        }}
      >
        {formatMessage({
          id: "profile.logout",
          defaultMessage: "退出登录",
        })}
      </Button>
    </Drawer>
  );
};

export default ProfileDrawer;
