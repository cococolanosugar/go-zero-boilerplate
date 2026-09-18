import React, { Suspense, lazy } from "react";
import { Button, Space, Tag, Typography, Row, Col, Card, Flex, Skeleton, theme } from "antd";
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
  CustomerServiceOutlined,
  DeploymentUnitOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { useOutletContext, useNavigate } from "react-router-dom";
import { APP_NAME } from "@zero/shared";
import { useAuth } from "../../contexts/AuthContext";
import { useIntl } from "../../contexts/LocaleContext";
import { useLayoutSettings } from "../../contexts/LayoutSettingsContext";
import { getAdminPortalUrl, getTitanPortalUrl } from "../../utils/env";

const TrafficChart = lazy(() => import("./components/TrafficChart"));

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { onOpenLogin } = useOutletContext<{ onOpenLogin: () => void }>();
  const { profile, isLoggedIn } = useAuth();
  const { formatMessage } = useIntl();
  const { isDark } = useLayoutSettings();
  const { token } = theme.useToken();

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
                onClick={() => window.open(getAdminPortalUrl(), "_blank")}
                style={{ background: "#722ed1", borderColor: "#722ed1" }}
              >
                {formatMessage({
                  id: "home.btn.enterAdmin",
                  defaultMessage: "进入管理后台 (:3001)",
                })}
              </Button>
              <Button
                size="large"
                shape="round"
                icon={<DeploymentUnitOutlined />}
                onClick={() => window.open(getTitanPortalUrl(), "_blank")}
                style={{ background: "#13c2c2", borderColor: "#13c2c2", color: "#fff" }}
              >
                {formatMessage({
                  id: "home.btn.enterTitan",
                  defaultMessage: "进入 Titan 交付平台 (:3002)",
                })}
              </Button>
              <Button
                size="large"
                shape="round"
                icon={<CustomerServiceOutlined />}
                onClick={() => navigate("/desk")}
                style={{ background: "#52c41a", borderColor: "#52c41a", color: "#fff" }}
              >
                {formatMessage({
                  id: "menu.desk",
                  defaultMessage: "IT 自助服务台",
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
              value: "4",
              suffix: formatMessage({ id: "home.stat.services.unit", defaultMessage: "个服务" }),
              description: <Text type="secondary">User (:8080) + Worker (:8082) + ITSM (:8084) + Titan (:8086)</Text>,
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

        {/* 微服务调用与流量监控图表 (Ant Design Charts 懒加载) */}
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
            defaultMessage: "实时模拟 Gateway、User RPC 与 Worker RPC 流量分发与链路耗时",
          })}
          headerBordered
          style={{ marginBottom: 32 }}
        >
          <Suspense
            fallback={
              <Skeleton
                active
                paragraph={{ rows: 6 }}
                style={{ padding: "16px 0" }}
              />
            }
          >
            <TrafficChart isDark={isDark} />
          </Suspense>
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
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                title={formatMessage({
                  id: "home.topology.gateway.title",
                  defaultMessage: "1. 统一对外网关",
                })}
                variant="borderless"
                style={{ background: "#f9f0ff" }}
              >
                <p>• {formatMessage({ id: "home.topology.gateway.port", defaultMessage: "端口: HTTP 8888" })}</p>
                <p>• {formatMessage({ id: "home.topology.gateway.jwt", defaultMessage: "JWT Auth 鉴权中间件" })}</p>
                <p>• {formatMessage({ id: "home.topology.gateway.result", defaultMessage: "pkg/result 统一输出结构" })}</p>
                <p>• {formatMessage({ id: "home.topology.gateway.finish", defaultMessage: "mr.Finish 跨微服务数据聚合" })}</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                title={formatMessage({
                  id: "home.topology.user.title",
                  defaultMessage: "2. 用户微服务",
                })}
                variant="borderless"
                style={{ background: "#e6f4ff" }}
              >
                <p>• {formatMessage({ id: "home.topology.user.port", defaultMessage: "端口: gRPC 8080" })}</p>
                <p>• {formatMessage({ id: "home.topology.user.life", defaultMessage: "企业员工全生命周期管理" })}</p>
                <p>• {formatMessage({ id: "home.topology.user.scope", defaultMessage: "角色与数据权限范围分配" })}</p>
                <p>• {formatMessage({ id: "home.topology.user.menu", defaultMessage: "动态菜单树与按钮权限下发" })}</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                title={formatMessage({
                  id: "home.topology.worker.title",
                  defaultMessage: "3. 任务微服务 (Worker)",
                })}
                variant="borderless"
                style={{ background: "#f6ffed" }}
              >
                <p>• {formatMessage({ id: "home.topology.worker.port", defaultMessage: "端口: gRPC 8082" })}</p>
                <p>• {formatMessage({ id: "home.topology.worker.temporal", defaultMessage: "Temporal 分布式任务引擎" })}</p>
                <p>• {formatMessage({ id: "home.topology.worker.saga", defaultMessage: "异步工作流与长耗时任务编排" })}</p>
                <p>• {formatMessage({ id: "home.topology.worker.report", defaultMessage: "任务调度状态实时上报" })}</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                title="4. ITSM 流程微服务"
                variant="borderless"
                style={{ background: "#fffbe6" }}
              >
                <p>• 端口: gRPC 8084</p>
                <p>• BPMN 2.0 工业级流程引擎与设计器</p>
                <p>• Temporal 分布式 SLA 履约超时监控</p>
                <p>• 全生命周期工单流转与动态表单</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                title="5. Titan 交付微服务"
                variant="borderless"
                style={{ background: "#f0f5ff" }}
              >
                <p>• 端口: gRPC 8086</p>
                <p>• 云原生持续交付与流水线编排</p>
                <p>• K8s Helm 3 幂等升级 + YAML SSA</p>
                <p>• Jenkins 委托调度与实时增量日志流</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                title={formatMessage({
                  id: "home.topology.infra.title",
                  defaultMessage: "6. 基础设施与发现",
                })}
                variant="borderless"
                style={{ background: "#fff7e6" }}
              >
                <p>• {formatMessage({ id: "home.topology.infra.mysql", defaultMessage: "MySQL 8.0 事务强一致存储" })}</p>
                <p>• {formatMessage({ id: "home.topology.infra.redis", defaultMessage: "Redis Cache-Aside 防击穿" })}</p>
                <p>• {formatMessage({ id: "home.topology.infra.nacos", defaultMessage: "Nacos / Etcd 服务无缝注册" })}</p>
                <p>• {formatMessage({ id: "home.topology.infra.docker", defaultMessage: "Docker Compose 一键编排" })}</p>
              </Card>
            </Col>
          </Row>
        </ProCard>
      </div>
    </PageContainer>
  );
};

export default HomePage;
