import React from "react";
import { Button, Space, Tag, Typography, Row, Col, Card, Flex } from "antd";
import {
  RocketOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  ClusterOutlined,
  SyncOutlined,
  ExportOutlined,
  LaptopOutlined,
} from "@ant-design/icons";
import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { useOutletContext } from "react-router-dom";
import { APP_NAME } from "@zero/shared";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const { onOpenLogin } = useOutletContext<{ onOpenLogin: () => void }>();
  const { profile, isLoggedIn } = useAuth();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* 顶部 Hero 区域 */}
      <div
        style={{
          textAlign: "center",
          padding: "56px 24px",
          background: "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
          borderRadius: 20,
          marginBottom: 36,
          boxShadow: "0 8px 24px rgba(114, 46, 209, 0.08)",
        }}
      >
        <Flex vertical align="center" gap={16} style={{ maxWidth: 760, margin: "0 auto" }}>
          <Space>
            <Tag color="purple" style={{ padding: "4px 12px", fontSize: 13, borderRadius: 12 }}>
              Ant Design 6.6.2 & Pro Components 驱动
            </Tag>
            <Tag color="blue" style={{ padding: "4px 12px", fontSize: 13, borderRadius: 12 }}>
              go-zero v1.10.3 微服务大仓
            </Tag>
          </Space>

          <Title level={1} style={{ margin: "12px 0 8px", color: "#22075e", fontSize: 36 }}>
            {APP_NAME} 官方技术门户
          </Title>

          <Paragraph style={{ fontSize: 17, color: "#531dab", lineHeight: 1.6 }}>
            统一 HTTP RESTful 网关 BFF 接入，纯 gRPC 隔离内部业务微服务，MySQL 8.0 与 Redis Cache-Aside 强一致持久层，全栈 IDL 契约自动化同步。
          </Paragraph>

          <Space size="middle" style={{ marginTop: 12 }}>
            <Button
              type="primary"
              size="large"
              shape="round"
              icon={<ExportOutlined />}
              onClick={() => window.open("http://localhost:3001", "_blank")}
              style={{ background: "#722ed1", borderColor: "#722ed1" }}
            >
              进入管理后台 (:3001)
            </Button>
            {!isLoggedIn && (
              <Button size="large" shape="round" icon={<LaptopOutlined />} onClick={onOpenLogin}>
                登录系统员工账号
              </Button>
            )}
            {isLoggedIn && profile && (
              <Tag color="purple" style={{ padding: "6px 14px", fontSize: 14 }}>
                当前登录: {profile.realName || profile.username} ({profile.deptName || "总部"})
              </Tag>
            )}
          </Space>
        </Flex>
      </div>

      {/* 实时平台运行指标 */}
      <StatisticCard.Group direction="row" style={{ marginBottom: 36 }}>
        <StatisticCard
          statistic={{
            title: "统一网关入口",
            value: ":8888",
            description: <Text type="secondary">HTTP RESTful BFF 流量总入口</Text>,
            icon: <ApiOutlined style={{ color: "#722ed1", fontSize: 32 }} />,
          }}
        />
        <StatisticCard.Divider />
        <StatisticCard
          statistic={{
            title: "核心业务微服务",
            value: "2",
            suffix: "个服务",
            description: <Text type="secondary">User (:8080) + Order (:8081)</Text>,
            icon: <ClusterOutlined style={{ color: "#1677ff", fontSize: 32 }} />,
          }}
        />
        <StatisticCard.Divider />
        <StatisticCard
          statistic={{
            title: "企业级 RBAC",
            value: "10",
            suffix: "张关联表",
            description: <Text type="secondary">菜单/按钮权限与接口一石二鸟联动</Text>,
            icon: <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 32 }} />,
          }}
        />
        <StatisticCard.Divider />
        <StatisticCard
          statistic={{
            title: "契约驱动开发",
            value: "100%",
            description: <Text type="secondary">goctl api ts 自动同步 SDK</Text>,
            icon: <SyncOutlined style={{ color: "#fa8c16", fontSize: 32 }} />,
          }}
        />
      </StatisticCard.Group>

      {/* 架构核心支柱 */}
      <Title level={3} style={{ marginBottom: 20 }}>
        微服务工业级架构支柱
      </Title>
      <Row gutter={[20, 20]} style={{ marginBottom: 36 }}>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable variant="borderless" style={{ height: "100%", background: "#fff" }}>
            <ThunderboltOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 12 }} />
            <Title level={4} style={{ marginBottom: 8 }}>
              极速微服务骨架
            </Title>
            <Paragraph type="secondary">
              基于 go-zero 框架设计，内置自适应负载均衡、级联超时取消、并发任务派发（mr.Finish）与链路追踪能力。
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable variant="borderless" style={{ height: "100%", background: "#fff" }}>
            <SafetyCertificateOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 12 }} />
            <Title level={4} style={{ marginBottom: 8 }}>
              严格职责边界隔离
            </Title>
            <Paragraph type="secondary">
              仅网关暴露 HTTP 端口，微服务纯 gRPC 运行；网关 Logic 严禁持有 SQL 句柄，核心领域规则在 RPC Logic 闭环。
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable variant="borderless" style={{ height: "100%", background: "#fff" }}>
            <RocketOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 12 }} />
            <Title level={4} style={{ marginBottom: 8 }}>
              多端大仓 Monorepo
            </Title>
            <Paragraph type="secondary">
              pnpm workspace 统一管理 admin 管理后台与 portal 门户系统，跨端共享 @zero/api 自动生成 SDK 与 @zero/shared 工具包。
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* 架构全景展示 */}
      <ProCard title="全栈架构拓扑与全景数据流" headerBordered style={{ marginBottom: 36 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small" title="1. 统一对外网关" variant="borderless" style={{ background: "#f9f0ff" }}>
              <p>• 端口: <strong>HTTP 8888</strong></p>
              <p>• JWT Auth 鉴权中间件</p>
              <p>• pkg/result 统一输出结构</p>
              <p>• mr.Finish 跨微服务数据聚合</p>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="2. 用户微服务" variant="borderless" style={{ background: "#e6f4ff" }}>
              <p>• 端口: <strong>gRPC 8080</strong></p>
              <p>• 企业员工全生命周期管理</p>
              <p>• 角色与数据权限范围分配</p>
              <p>• 动态菜单树与按钮权限下发</p>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="3. 订单微服务" variant="borderless" style={{ background: "#f6ffed" }}>
              <p>• 端口: <strong>gRPC 8081</strong></p>
              <p>• 订单状态流转与明细聚合</p>
              <p>• 跨微服务数据契约协同</p>
              <p>• 分布式链路追踪集成</p>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="4. 基础设施与发现" variant="borderless" style={{ background: "#fff7e6" }}>
              <p>• <strong>MySQL 8.0</strong> 事务强一致存储</p>
              <p>• <strong>Redis</strong> Cache-Aside 防击穿</p>
              <p>• <strong>Nacos / Etcd</strong> 服务无缝注册</p>
              <p>• <strong>Docker Compose</strong> 一键编排</p>
            </Card>
          </Col>
        </Row>
      </ProCard>
    </div>
  );
};

export default HomePage;
