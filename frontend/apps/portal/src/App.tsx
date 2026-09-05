import React, { useEffect, useState } from "react";
import {
  ConfigProvider,
  App as AntdApp,
  Layout,
  Menu,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Avatar,
  Space,
  Tag,
  Divider,
} from "antd";
import {
  ThunderboltOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { login, getUserInfo, setToken, getToken, type UserInfoResp } from "@zero/api";
import { APP_NAME } from "@zero/shared";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function App() {
  const [user, setUser] = useState<UserInfoResp | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!getToken()) {
          const loginRes = await login({ mobile: "13800000000", password: "123456" });
          setToken(loginRes.accessToken);
        }
        const u = await getUserInfo();
        setUser(u);
      } catch (err) {
        console.error("加载用户失败", err);
      }
    };
    init();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#722ed1", // 紫色主色调，体现门户与后台视觉区隔
          borderRadius: 12,
        },
      }}
    >
      <AntdApp>
        <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <RocketOutlined style={{ fontSize: 24, color: "#722ed1" }} />
            <Text strong style={{ fontSize: 18 }}>
              {APP_NAME}
            </Text>
          </div>

          <Menu
            mode="horizontal"
            defaultSelectedKeys={["home"]}
            style={{ flex: 1, minWidth: 0, justifyContent: "center", borderBottom: "none" }}
            items={[
              { key: "home", label: "首页" },
              { key: "features", label: "架构特性" },
              { key: "docs", label: "微服务文档" },
            ]}
          />

          <div>
            {user ? (
              <Space>
                <Avatar src={user.avatar} icon={<UserOutlined />} />
                <Text strong>{user.name}</Text>
                <Tag color="purple">已登录</Tag>
              </Space>
            ) : (
              <Button type="primary" shape="round">
                登录 / 注册
              </Button>
            )}
          </div>
        </Header>

        <Content style={{ padding: "48px" }}>
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
              borderRadius: 16,
              marginBottom: 48,
            }}
          >
            <Tag color="purple" style={{ marginBottom: 16, fontSize: "14px", padding: "4px 12px" }}>
              Ant Design 6.6.2 驱动
            </Tag>
            <Title level={1} style={{ marginBottom: 16 }}>
              全栈微服务 Monorepo 体系
            </Title>
            <Paragraph style={{ fontSize: 18, color: "#666", maxWidth: 600, margin: "0 auto 24px" }}>
              基于 go-zero 统一 HTTP 网关、纯 gRPC 业务微服务、契约自动同步生成的前端 React 现代化应用。
            </Paragraph>
            <Space size="middle">
              <Button type="primary" size="large" shape="round">
                快速开始
              </Button>
              <Button size="large" shape="round">
                进入管理后台
              </Button>
            </Space>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card hoverable style={{ height: "100%" }}>
                <ThunderboltOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 16 }} />
                <Title level={4}>高性能微服务</Title>
                <Paragraph type="secondary">
                  后端采用 go-zero 框架，具备自适应熔断、限流、负载均衡及 OpenTelemetry 追踪能力。
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ height: "100%" }}>
                <SafetyCertificateOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 16 }} />
                <Title level={4}>统一安全网关</Title>
                <Paragraph type="secondary">
                  单一 HTTP 8888 端口对外，内部服务纯 gRPC 隔离，安全可靠。
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ height: "100%" }}>
                <RocketOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 16 }} />
                <Title level={4}>全栈契约同步</Title>
                <Paragraph type="secondary">
                  通过 goctl api ts 自动从网关契约生成前端强类型 SDK，零沟通成本。
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </Content>

        <Footer style={{ textAlign: "center", color: "#999" }}>
          {APP_NAME} ©2026 Powered by go-zero & Ant Design 6.6.2
        </Footer>
      </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}
