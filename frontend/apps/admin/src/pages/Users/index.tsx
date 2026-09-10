import React, { useState, useEffect } from "react";
import { App as AntdApp, Card, Tag, Avatar, Space, Button } from "antd";
import { PageContainer, ProDescriptions } from "@ant-design/pro-components";
import { UserOutlined, SafetyCertificateOutlined, ReloadOutlined } from "@ant-design/icons";
import { getUserInfo, type UserInfoResp } from "@zero/api";
import { maskPhone, copyToClipboard } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";

export const UsersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const [user, setUser] = useState<UserInfoResp | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await getUserInfo();
      setUser(res);
    } catch (err: any) {
      message.error(`拉取用户信息失败: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.users.title", defaultMessage: "微服务用户中心" }),
        subTitle: formatMessage({ id: "pages.users.subTitle", defaultMessage: "展示当前通过 JWT 鉴权向 User RPC 微服务拉取的安全用户信息" }),
        extra: [
          <Button
            key="refresh"
            type="primary"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchUser}
          >
            刷新用户信息
          </Button>,
        ],
      }}
    >
      <Card variant="borderless">
        <ProDescriptions
          loading={loading}
          column={{ xs: 1, sm: 2 }}
          title={
            <Space>
              <Avatar size="large" src={user?.avatar} icon={<UserOutlined />} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.name || "管理员用户"}</div>
                <div style={{ fontSize: 13, color: "#888" }}>用户 ID: {user?.id || 1}</div>
              </div>
            </Space>
          }
        >
          <ProDescriptions.Item label="绑定手机号">
            <Space size="small">
              <span>{maskPhone(user?.mobile || "13800000000")}</span>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={async () => {
                  const ok = await copyToClipboard(user?.mobile || "13800000000");
                  if (ok) message.success("手机号已复制");
                }}
              >
                复制
              </Button>
            </Space>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="系统角色">
            <Tag color="geekblue">超级管理员 (Super Admin)</Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="鉴权方式">
            <Tag icon={<SafetyCertificateOutlined />} color="purple">
              JWT Bearer 签名校验 (Gateway)
            </Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="下游微服务通道">
            <Tag color="cyan">User RPC (gRPC :8080)</Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="账号状态">
            <Tag color="success">正常启用</Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="安全等级">
            <Tag color="gold">Bcrypt 高强度加盐哈希存储</Tag>
          </ProDescriptions.Item>
        </ProDescriptions>
      </Card>
    </PageContainer>
  );
};

export default UsersPage;