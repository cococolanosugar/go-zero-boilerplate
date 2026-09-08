import React, { useState } from "react";
import { App, Button, Tag, Modal, Form, Input, Typography, Space } from "antd";
import {
  KeyOutlined,
  MobileOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import { useInitialState } from "../../../contexts/InitialStateContext";

const { Text } = Typography;

export const SecurityView: React.FC = () => {
  const { message } = App.useApp();
  const { initialState } = useInitialState();
  const currentUser = initialState.currentUser;

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();

  const handlePasswordSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error("两次输入的新密码不一致！");
        return;
      }
      setPasswordLoading(true);
      // 模拟更新密码
      await new Promise((resolve) => setTimeout(resolve, 600));
      message.success("登录密码修改成功，下次登录请使用新密码！");
      setPasswordModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.message || "密码修改失败");
    } finally {
      setPasswordLoading(false);
    }
  };

  const securityItems = [
    {
      key: "password",
      icon: <KeyOutlined style={{ fontSize: 24, color: "#1677ff" }} />,
      title: "账户密码",
      description: (
        <Space orientation="vertical" size={2}>
          <span>
            当前密码强度：<Tag color="success">高强度</Tag>
          </span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            建议定期更换包含字母、数字及特殊符号的复杂密码以保障账户安全
          </Text>
        </Space>
      ),
      action: (
        <Button type="link" onClick={() => setPasswordModalOpen(true)}>
          修改密码
        </Button>
      ),
    },
    {
      key: "phone",
      icon: <MobileOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      title: "密保手机",
      description: (
        <Space orientation="vertical" size={2}>
          <span>
            已绑定手机：
            {currentUser?.mobile
              ? currentUser.mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
              : "138****8888"}
          </span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            密保手机可用于找回登录密码、身份安全二次核验及异地登录提醒
          </Text>
        </Space>
      ),
      action: (
        <Button type="link" onClick={() => message.info("密保手机变更需验证原手机短信验证码")}>
          更换手机
        </Button>
      ),
    },
    {
      key: "email",
      icon: <MailOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      title: "密保邮箱",
      description: (
        <Space orientation="vertical" size={2}>
          <span>已绑定邮箱：{currentUser?.email || "admin@example.com"}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            密保邮箱用于接收系统重要安全事件通知、审计告警与找回凭据
          </Text>
        </Space>
      ),
      action: (
        <Button type="link" onClick={() => message.info("密保邮箱修改功能已向管理员开放")}>
          修改邮箱
        </Button>
      ),
    },
    {
      key: "mfa",
      icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: "#fa8c16" }} />,
      title: "MFA 双因子认证",
      description: (
        <Space orientation="vertical" size={2}>
          <span>
            TOTP 动态口令：<Tag color="default">未开启</Tag>
          </span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            绑定 Google Authenticator 或 Microsoft Authenticator，每次登录需输入 6 位动态口令
          </Text>
        </Space>
      ),
      action: (
        <Button type="link" onClick={() => message.info("MFA 双因子密钥生成器待管理员开通权限")}>
          立即开启
        </Button>
      ),
    },
    {
      key: "devices",
      icon: <DesktopOutlined style={{ fontSize: 24, color: "#13c2c2" }} />,
      title: "当前登录设备",
      description: (
        <Space orientation="vertical" size={2}>
          <span>当前会话：127.0.0.1 (本机开发环境) · Chrome / Windows</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            通过统一网关 JWT Token 鉴权，支持一键登出其他设备
          </Text>
        </Space>
      ),
      action: (
        <Button type="link" danger onClick={() => message.success("已清除其他所有客户端历史会话")}>
          下线其他设备
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {securityItems.map((item, index) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 0",
              borderBottom:
                index < securityItems.length - 1
                  ? "1px solid var(--ant-color-border-secondary, #f0f0f0)"
                  : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ marginTop: 2 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                <div>{item.description}</div>
              </div>
            </div>
            <div>{item.action}</div>
          </div>
        ))}
      </div>

      <Modal
        title="修改账户密码"
        open={passwordModalOpen}
        onOk={handlePasswordSubmit}
        confirmLoading={passwordLoading}
        onCancel={() => {
          setPasswordModalOpen(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="oldPassword"
            label="当前登录原密码"
            rules={[{ required: true, message: "请输入当前原密码" }]}
          >
            <Input.Password placeholder="请输入当前旧密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="设置新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "新密码长度至少 6 位" },
            ]}
          >
            <Input.Password placeholder="请输入包含字母或数字的新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致！"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码以确认" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SecurityView;
