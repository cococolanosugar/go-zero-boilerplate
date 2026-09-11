import React from "react";
import { Button, Space, Tag, Typography, Row, Col, Card, Flex, theme } from "antd";
import {
  RocketOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  ClusterOutlined,
  SyncOutlined,
  ExportOutlined,
  LaptopOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { Area } from "@ant-design/charts";
import { useOutletContext } from "react-router-dom";
import { APP_NAME } from "@zero/shared";
import { useAuth } from "../../contexts/AuthContext";
import { useIntl } from "../../contexts/LocaleContext";
import { useLayoutSettings } from "../../contexts/LayoutSettingsContext";

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const { onOpenLogin } = useOutletContext<{ onOpenLogin: () => void }>();
  const { profile, isLoggedIn } = useAuth();
  const { formatMessage } = useIntl();
  const { isDark } = useLayoutSettings();
  const { token } = theme.useToken();

  const trafficData = [
    { time: "09-01", service: "Gateway (HTTP)", qps: 1240 },
    { time: "09-01", service: "User RPC", qps: 820 },
    { time: "09-01", service: "Order RPC", qps: 420 },
    { time: "09-02", service: "Gateway (HTTP)", qps: 1480 },
    { time: "09-02", service: "User RPC", qps: 960 },
    { time: "09-02", service: "Order RPC", qps: 520 },
    { time: "09-03", service: "Gateway (HTTP)", qps: 1890 },
    { time: "09-03", service: "User RPC", qps: 1250 },
    { time: "09-03", service: "Order RPC", qps: 640 },
    { time: "09-04", service: "Gateway (HTTP)", qps: 2100 },
    { time: "09-04", service: "User RPC", qps: 1420 },
    { time: "09-04", service: "Order RPC", qps: 680 },
    { time: "09-05", service: "Gateway (HTTP)", qps: 2650 },
    { time: "09-05", service: "User RPC", qps: 1800 },
    { time: "09-05", service: "Order RPC", qps: 850 },
    { time: "09-06", service: "Gateway (HTTP)", qps: 3120 },
    { time: "09-06", service: "User RPC", qps: 2150 },
    { time: "09-06", service: "Order RPC", qps: 970 },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "menu.home", defaultMessage: "门户首页" }),
        subTitle: `${APP_NAME} ${formatMessage({ id: "home.hero.title", defaultMessage: "官方技术门户" })}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* 顶部 Hero 区域 */}
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
            borderRadius: 20,
            marginBottom: 32,
            boxShadow: "0 8px 24px rgba(114, 46, 209, 0.08)",
          }}
        >
          <Flex vertical align="center" gap={16} style={{ maxWidth: 780, margin: "0 auto" }}>
            <Space wrap>
              <Tag color="purple" style={{ padding: "4px 12px", fontSize: 13, borderRadius: 12 }}>
                {formatMessage({
                  id: "home.badge.tech",
                  defaultMessage: "Ant Design 6.6.2 & Pro Components 驱动",
                })}
              </Tag>
              <Tag color="blue" style={{ padding: "4px 12px", fontSize: 13, borderRadius: 12 }}>
                {formatMessage({
                  id: "home.badge.backend",
                  defaultMessage: "go-zero v1.10.3 微服务大仓",
                })}
              </Tag>
            </Space>

            <Title level={1} style={{ margin: "8px 0", color: "#22075e", fontSize: 36 }}>
              {APP_NAME} {formatMessage({ id: "home.hero.title", defaultMessage: "官方技术门户" })}
            </Title>

            <Paragraph style={{ fontSize: 16, color: "#531dab", lineHeight: 1.6 }}>
              {formatMessage({
                id: "home.hero.desc",
                defaultMessage:
                  "统一 HTTP RESTful 网关 BFF 接入，纯 gRPC 隔离内部业务微服务，MySQL 8.0 与 Redis Cache-Aside 强一致持久层，全栈 IDL 契约自动化同步。",
              })}
            </Paragraph>

            <Space size="middle" wrap style={{ marginTop: 8 }}>
              <Button
                type="primary"
                size="large"
                shape="round"
                icon={<ExportOutlined />}
                onClick={() => window.open("http://localhost:3001", "_blank")}
                style={{ background: "#722ed1", borderColor: "#722ed1" }}
              >
                {formatMessage({
                  id: "home.btn.enterAdmin",
                  defaultMessage: "进入管理后台 (:3001)",
                })}
              </Button>
              {!isLoggedIn && (
                <Button size="large" shape="round" icon={<LaptopOutlined />} onClick={onOpenLogin}>
                  {formatMessage({
                    id: "home.btn.login",
                    defaultMessage: "登录系统员工账号",
                  })}
                </Button>
              )}
              {isLoggedIn && profile && (
                <Tag color="purple" style={{ padding: "6px 14px", fontSize: 14 }}>
                  {formatMessage({ id: "home.tag.currentLogin", defaultMessage: "当前登录" })}:{" "}
                  {profile.realName || profile.username} ({profile.deptName || "总部"})
                </Tag>
              )}
            </Space>
          </Flex>
        </div>

        {/* 实时平台运行指标 */}
        <StatisticCard.Group direction="row" style={{ marginBottom: 32 }}>
          <StatisticCard
            statistic={{
              title: formatMessage({ id: "home.stat.gateway", defaultMessage: "统一网关入口" }),
              value: ":8888",
              description: (
                <Text type="secondary">
                  {formatMessage({
                    id: "home.stat.gateway.desc",
                    defaultMessage: "HTTP RESTful BFF 流量总入口",
                  })}
                </Text>
              ),
              icon: <ApiOutlined style={{ color: "#722ed1", fontSize: 32 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: formatMessage({ id: "home.stat.services", defaultMessage: "核心业务微服务" }),
              value: "2",
              suffix: formatMessage({ id: "home.stat.services.unit", defaultMessage: "个服务" }),
              description: <Text type="secondary">User (:8080) + Order (:8081)</Text>,
              icon: <ClusterOutlined style={{ color: "#1677ff", fontSize: 32 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: formatMessage({ id: "home.stat.rbac", defaultMessage: "企业级 RBAC" }),
              value: "10",
              suffix: formatMessage({ id: "home.stat.rbac.unit", defaultMessage: "张关联表" }),
              description: (
                <Text type="secondary">
                  {formatMessage({
                    id: "home.stat.rbac.desc",
                    defaultMessage: "菜单/按钮权限与接口一石二鸟联动",
                  })}
                </Text>
              ),
              icon: <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 32 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: formatMessage({ id: "home.stat.contract", defaultMessage: "契约驱动开发" }),
              value: "100%",
              description: (
                <Text type="secondary">
                  {formatMessage({
                    id: "home.stat.contract.desc",
                    defaultMessage: "goctl api ts 自动同步 SDK",
                  })}
                </Text>
              ),
              icon: <SyncOutlined style={{ color: "#fa8c16", fontSize: 32 }} />,
            }}
          />
        </StatisticCard.Group>

        {/* 微服务调用与流量监控图表 (Ant Design Charts) */}
        <ProCard
          title={
            <Space>
              <LineChartOutlined style={{ color: "#722ed1" }} />
              <span style={{ fontWeight: 600 }}>
                {formatMessage({
                  id: "home.chart.title",
                  defaultMessage: "微服务集群调用量与流量监控",
                })}
              </span>
            </Space>
          }
          subTitle={formatMessage({
            id: "home.chart.subtitle",
            defaultMessage: "实时模拟 Gateway、User RPC 与 Order RPC 流量分发与链路耗时",
          })}
          headerBordered
          style={{ marginBottom: 32 }}
        >
          <Area
            data={trafficData}
            xField="time"
            yField="qps"
            colorField="service"
            shapeField="smooth"
            height={260}
            theme={isDark ? "classicDark" : "classic"}
            scale={{
              color: {
                range: ["#722ed1", "#1677ff", "#52c41a"],
              },
            }}
            legend={{
              color: {
                position: "bottom" as const,
              },
            }}
          />
        </ProCard>

        {/* 架构核心支柱 */}
        <Title level={3} style={{ marginBottom: 20 }}>
          {formatMessage({
            id: "home.pillars.title",
            defaultMessage: "微服务工业级架构支柱",
          })}
        </Title>
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={8}>
            <Card hoverable variant="borderless" style={{ height: "100%", background: token.colorBgContainer }}>
              <ThunderboltOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 12 }} />
              <Title level={4} style={{ marginBottom: 8 }}>
                {formatMessage({
                  id: "home.pillar1.title",
                  defaultMessage: "极速微服务骨架",
                })}
              </Title>
              <Paragraph type="secondary">
                {formatMessage({
                  id: "home.pillar1.desc",
                  defaultMessage:
                    "基于 go-zero 框架设计，内置自适应负载均衡、级联超时取消、并发任务派发（mr.Finish）与链路追踪能力。",
                })}
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card hoverable variant="borderless" style={{ height: "100%", background: token.colorBgContainer }}>
              <SafetyCertificateOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 12 }} />
              <Title level={4} style={{ marginBottom: 8 }}>
                {formatMessage({
                  id: "home.pillar2.title",
                  defaultMessage: "严格职责边界隔离",
                })}
              </Title>
              <Paragraph type="secondary">
                {formatMessage({
                  id: "home.pillar2.desc",
                  defaultMessage:
                    "仅网关暴露 HTTP 端口，微服务纯 gRPC 运行；网关 Logic 严禁持有 SQL 句柄，核心领域规则在 RPC Logic 闭环。",
                })}
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card hoverable variant="borderless" style={{ height: "100%", background: token.colorBgContainer }}>
              <RocketOutlined style={{ fontSize: 32, color: "#722ed1", marginBottom: 12 }} />
              <Title level={4} style={{ marginBottom: 8 }}>
                {formatMessage({
                  id: "home.pillar3.title",
                  defaultMessage: "多端大仓 Monorepo",
                })}
              </Title>
              <Paragraph type="secondary">
                {formatMessage({
                  id: "home.pillar3.desc",
                  defaultMessage:
                    "pnpm workspace 统一管理 admin 管理后台与 portal 门户系统，跨端共享 @zero/api 自动生成 SDK 与 @zero/shared 工具包。",
                })}
              </Paragraph>
            </Card>
          </Col>
        </Row>

        {/* 架构全景展示 */}
        <ProCard
          title={formatMessage({
            id: "home.topology.title",
            defaultMessage: "全栈架构拓扑与全景数据流",
          })}
          headerBordered
          style={{ marginBottom: 32 }}
        >
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
    </PageContainer>
  );
};

export default HomePage;
