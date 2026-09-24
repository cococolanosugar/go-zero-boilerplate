import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Button,
  Typography,
  Badge,
  Tabs,
  Skeleton,
  Empty,
  Result,
  theme,
} from "antd";
import {
  DeploymentUnitOutlined,
  PlayCircleOutlined,
  ClusterOutlined,
  ApiOutlined,
  ExportOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import {
  titanListPipelines,
  titanListClusters,
  titanListIntegrations,
  type PipelineVO,
  type ClusterVO,
  type IntegrationVO,
} from "@zero/api";
import { useAuth } from "../../contexts/AuthContext";
import { useOutletContext } from "react-router-dom";
import { getTitanPortalUrl, getAdminPortalUrl } from "../../utils/env";

const { Title, Paragraph, Text } = Typography;

export const TitanPortalPage: React.FC = () => {
  const { token } = theme.useToken();
  const { isLoggedIn } = useAuth();
  const outletCtx = useOutletContext<{ onOpenLogin?: () => void }>() || {};
  const onOpenLogin = outletCtx.onOpenLogin || (() => {});

  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState<PipelineVO[]>([]);
  const [clusters, setClusters] = useState<ClusterVO[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationVO[]>([]);
  const [activeTab, setActiveTab] = useState("pipelines");

  useEffect(() => {
    if (!isLoggedIn) return;

    setLoading(true);
    Promise.allSettled([
      titanListPipelines({ page: 1, pageSize: 20 }),
      titanListClusters({ page: 1, pageSize: 20 }),
      titanListIntegrations({ page: 1, pageSize: 20 }),
    ])
      .then(([pipeRes, clusterRes, integRes]) => {
        if (pipeRes.status === "fulfilled" && pipeRes.value?.list) {
          setPipelines(pipeRes.value.list);
        }
        if (clusterRes.status === "fulfilled" && clusterRes.value?.list) {
          setClusters(clusterRes.value.list);
        }
        if (integRes.status === "fulfilled" && integRes.value?.list) {
          setIntegrations(integRes.value.list);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoggedIn]);

  const titanUrl = getTitanPortalUrl();
  const adminTitanUrl = `${getAdminPortalUrl()}/titan/pipelines`;

  return (
    <PageContainer
      header={{
        title: "Titan 研发交付平台",
        subTitle: "云原生持续交付、Kubernetes 编排、Helm / YAML 声明式发布与 Jenkins 任务调度",
        extra: [
          <Button
            key="admin-titan"
            icon={<ExportOutlined />}
            onClick={() => window.open(adminTitanUrl, "_blank")}
          >
            进入管理后台 CI/CD
          </Button>,
          <Button
            key="open-titan"
            type="primary"
            icon={<DeploymentUnitOutlined />}
            onClick={() => window.open(titanUrl, "_blank")}
            style={{ background: "#722ed1", borderColor: "#722ed1" }}
          >
            打开 Titan 独立工作台 (:3002)
          </Button>,
        ],
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Hero 介绍区域 */}
        <div
          style={{
            background: "linear-gradient(135deg, #1f1f38 0%, #120338 50%, #22075e 100%)",
            color: "#fff",
            borderRadius: 16,
            padding: "36px 32px",
            marginBottom: 24,
            boxShadow: "0 8px 24px rgba(34, 7, 94, 0.25)",
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color="purple">Titan CI/CD 引擎</Tag>
                <Tag color="cyan">Kubernetes Helm & YAML SSA</Tag>
                <Tag color="blue">Jenkins 调度适配</Tag>
                <Tag color="green">独立工作台 (:3002)</Tag>
              </Space>
              <Title level={2} style={{ color: "#fff", margin: "8px 0 12px" }}>
                企业级云原生持续交付平台
              </Title>
              <Paragraph style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 15, lineHeight: 1.6 }}>
                Titan 作为 go-zero-boilerplate 大仓的核心研发效能与发布中枢，通过纯 gRPC 微服务（端口 8086）
                实现外部工具链（GitLab、Harbor、Jenkins）深度集成、多环境 Kubernetes 集群声明式纳管，
                以及基于 Temporal 的高可用流水线编排与人工质量门禁卡点。
              </Paragraph>
              <Space size="middle" wrap style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ExportOutlined />}
                  onClick={() => window.open(titanUrl, "_blank")}
                  style={{ background: "#9254de", borderColor: "#9254de" }}
                >
                  直达 Titan 独立交付工作台
                </Button>
                {!isLoggedIn && (
                  <Button size="large" ghost onClick={onOpenLogin}>
                    登录员工账号查看实时集群与流水线
                  </Button>
                )}
              </Space>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "center" }}>
              <DeploymentUnitOutlined style={{ fontSize: 120, color: "rgba(179, 127, 255, 0.3)" }} />
            </Col>
          </Row>
        </div>

        {/* 核心指标看板 */}
        <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
          <StatisticCard
            statistic={{
              title: "交付流水线",
              value: isLoggedIn ? pipelines.length : 2,
              suffix: "条模型",
              description: <Text type="secondary">微服务大仓与前端多端发布流水线</Text>,
              icon: <PlayCircleOutlined style={{ color: "#722ed1", fontSize: 28 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: "纳管 K8s 集群",
              value: isLoggedIn ? clusters.length : 3,
              suffix: "个集群",
              description: <Text type="secondary">Dev、Staging 与 Prod 生产高可用环境</Text>,
              icon: <ClusterOutlined style={{ color: "#1677ff", fontSize: 28 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: "工具链集成凭证",
              value: isLoggedIn ? integrations.length : 3,
              suffix: "个源端",
              description: <Text type="secondary">GitLab、Harbor 与 Jenkins 凭证纳管</Text>,
              icon: <ApiOutlined style={{ color: "#52c41a", fontSize: 28 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: "发布引擎模式",
              value: "双模",
              description: <Text type="secondary">Helm 3 幂等升级 + K8s YAML SSA</Text>,
              icon: <ThunderboltOutlined style={{ color: "#fa8c16", fontSize: 28 }} />,
            }}
          />
        </StatisticCard.Group>

        {/* 流水线与集群大盘 Tabs */}
        <ProCard>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "pipelines",
                label: (
                  <Space>
                    <PlayCircleOutlined />
                    <span>交付流水线 ({isLoggedIn ? pipelines.length : "示例"})</span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 12 }}>
                    {loading ? (
                      <Skeleton active paragraph={{ rows: 4 }} />
                    ) : !isLoggedIn ? (
                      <Result
                        icon={<DeploymentUnitOutlined style={{ color: "#722ed1" }} />}
                        title="查看实时流水线列表"
                        subTitle="当前未登录，请先登录系统员工账号以调取网关 Titan API，或直接打开 Titan 独立工作台。"
                        extra={[
                          <Button key="login" type="primary" onClick={onOpenLogin}>
                            登录账号
                          </Button>,
                          <Button key="open" onClick={() => window.open(titanUrl, "_blank")}>
                            访问 Titan 工作台 (:3002)
                          </Button>,
                        ]}
                      />
                    ) : pipelines.length === 0 ? (
                      <Empty description="暂无交付流水线，可前往 Titan 工作台创建" />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {pipelines.map((p) => {
                          let stagesCount = 0;
                          try {
                            const parsed = JSON.parse(p.stages || "[]");
                            stagesCount = Array.isArray(parsed) ? parsed.length : 0;
                          } catch {
                            // ignore
                          }

                          return (
                            <Col xs={24} sm={12} key={p.id}>
                              <Card
                                hoverable
                                variant="borderless"
                                style={{ background: token.colorBgContainer, height: "100%" }}
                                title={
                                  <Space>
                                    <PlayCircleOutlined style={{ color: "#722ed1" }} />
                                    <span style={{ fontWeight: 600 }}>{p.displayName || p.name}</span>
                                    <Tag color={p.category === "frontend" ? "cyan" : "purple"}>
                                      {p.category}
                                    </Tag>
                                  </Space>
                                }
                                extra={
                                  <Tag color={p.status === 1 ? "success" : "default"}>
                                    {p.status === 1 ? "已就绪" : "已停用"}
                                  </Tag>
                                }
                              >
                                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                                  {p.description || "无流水线描述"}
                                </Paragraph>
                                <Space wrap style={{ marginBottom: 12 }}>
                                  <Tag icon={<BranchesOutlined />}>{p.gitBranch || "master"}</Tag>
                                  <Tag color="geekblue">{stagesCount} 个执行阶段</Tag>
                                </Space>
                                <div style={{ textAlign: "right" }}>
                                  <Button
                                    type="link"
                                    icon={<ExportOutlined />}
                                    onClick={() => window.open(`${titanUrl}/pipelines`, "_blank")}
                                  >
                                    在 Titan 中查看
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>
                ),
              },
              {
                key: "clusters",
                label: (
                  <Space>
                    <ClusterOutlined />
                    <span>纳管 K8s 集群 ({isLoggedIn ? clusters.length : "示例"})</span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 12 }}>
                    {loading ? (
                      <Skeleton active paragraph={{ rows: 4 }} />
                    ) : !isLoggedIn ? (
                      <Result
                        icon={<ClusterOutlined style={{ color: "#1677ff" }} />}
                        title="查看 Kubernetes 集群大盘"
                        subTitle="请先登录系统员工账号以调取集群状态接口。"
                        extra={[
                          <Button key="login" type="primary" onClick={onOpenLogin}>
                            登录账号
                          </Button>,
                          <Button key="open" onClick={() => window.open(titanUrl, "_blank")}>
                            访问 Titan 工作台 (:3002)
                          </Button>,
                        ]}
                      />
                    ) : clusters.length === 0 ? (
                      <Empty description="暂无已纳管的集群" />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {clusters.map((c) => {
                          const envColorMap: Record<string, string> = {
                            dev: "cyan",
                            staging: "orange",
                            prod: "red",
                          };

                          return (
                            <Col xs={24} sm={8} key={c.id}>
                              <Card
                                hoverable
                                variant="borderless"
                                style={{ background: token.colorBgContainer, height: "100%" }}
                                title={
                                  <Space>
                                    <ClusterOutlined style={{ color: "#1677ff" }} />
                                    <span>{c.name}</span>
                                  </Space>
                                }
                                extra={
                                  <Tag color={envColorMap[c.env] || "blue"}>
                                    {c.env?.toUpperCase()}
                                  </Tag>
                                }
                              >
                                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                                  {c.description || "无集群描述"}
                                </Paragraph>
                                <Space vertical size={4} style={{ width: "100%" }}>
                                  <Text style={{ fontSize: 12 }} type="secondary">
                                    端点: <Text copyable={{ text: c.apiEndpoint }}>{c.apiEndpoint || "内网托管"}</Text>
                                  </Text>
                                  <Space>
                                    <Badge status={c.status === "ACTIVE" || c.status === "HEALTHY" ? "success" : "warning"} />
                                    <Text style={{ fontSize: 13 }}>版本: {c.version || "v1.28.x"}</Text>
                                  </Space>
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>
                ),
              },
              {
                key: "integrations",
                label: (
                  <Space>
                    <ApiOutlined />
                    <span>集成管理 ({isLoggedIn ? integrations.length : "示例"})</span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 12 }}>
                    {loading ? (
                      <Skeleton active paragraph={{ rows: 4 }} />
                    ) : !isLoggedIn ? (
                      <Result
                        icon={<ApiOutlined style={{ color: "#52c41a" }} />}
                        title="查看工具链集成凭证"
                        subTitle="请先登录系统员工账号查看。"
                        extra={[
                          <Button key="login" type="primary" onClick={onOpenLogin}>
                            登录账号
                          </Button>,
                        ]}
                      />
                    ) : integrations.length === 0 ? (
                      <Empty description="暂无集成凭证" />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {integrations.map((i) => (
                          <Col xs={24} sm={8} key={i.id}>
                            <Card
                              hoverable
                              variant="borderless"
                              style={{ background: token.colorBgContainer, height: "100%" }}
                              title={
                                <Space>
                                  <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
                                  <span>{i.name}</span>
                                </Space>
                              }
                              extra={<Tag color="green">{i.category?.toUpperCase()}</Tag>}
                            >
                              <Paragraph type="secondary">{i.description || "无说明"}</Paragraph>
                              <Tag color="geekblue">认证: {i.authType}</Tag>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </ProCard>
      </div>
    </PageContainer>
  );
};

export default TitanPortalPage;
