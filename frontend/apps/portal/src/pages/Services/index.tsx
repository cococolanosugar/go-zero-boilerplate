import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  theme,
  Badge,
  Spin,
  Alert,
  Tooltip,
} from "antd";
import {
  ClusterOutlined,
  ApiOutlined,
  CloudServerOutlined,
  AuditOutlined,
  DeploymentUnitOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { PageContainer, StatisticCard } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import {
  MICROSERVICES_CATALOG,
  INFRA_CATALOG,
  ServiceItemVO,
} from "./components/catalogData";
import {
  probeAllServicesHealth,
  ServiceHealthVO,
} from "./components/probes";
import { TopologyGraph } from "./components/TopologyGraph";
import { ServiceDetailDrawer } from "./components/ServiceDetailDrawer";
import { InfraCatalog } from "./components/InfraCatalog";

const { Title, Text, Paragraph } = Typography;

export const ServicesPage: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [healthMap, setHealthMap] = useState<Record<string, ServiceHealthVO>>({});
  const [probing, setProbing] = useState(false);

  // 批量触发服务探针
  const handleProbe = useCallback(async () => {
    setProbing(true);
    try {
      const allIds = [
        ...MICROSERVICES_CATALOG.map((s) => s.id),
        ...INFRA_CATALOG.map((i) => i.id),
      ];
      const res = await probeAllServicesHealth(allIds);
      setHealthMap(res);
    } finally {
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    handleProbe();
  }, [handleProbe]);

  // 当前选中的微服务对象
  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return MICROSERVICES_CATALOG.find((s) => s.id === selectedServiceId) || null;
  }, [selectedServiceId]);

  // 处理拓扑图节点点击
  const handleSelectNode = (nodeId: string) => {
    const isService = MICROSERVICES_CATALOG.some((s) => s.id === nodeId);
    if (isService) {
      setSelectedServiceId(nodeId);
      setDrawerOpen(true);
    } else {
      setSelectedServiceId(nodeId);
    }
  };

  // 跳转至 API Hub 调试
  const handleJumpToApiHub = (tagKey: string) => {
    navigate("/api-hub");
  };

  // 统计健康服务数
  const healthyCount = useMemo(() => {
    const services = MICROSERVICES_CATALOG;
    return services.filter((s) => {
      const h = healthMap[s.id];
      return h ? h.status === "healthy" : true;
    }).length;
  }, [healthMap]);

  return (
    <PageContainer
      header={{
        title: "微服务软件目录与全景拓扑 (Service Catalog & Topology)",
        subTitle: "全栈 Monorepo 微服务资产目录、三层架构调用依赖拓扑与实时健康探针监控",
        extra: [
          <Button
            key="probe"
            icon={<ReloadOutlined spin={probing} />}
            onClick={handleProbe}
            loading={probing}
          >
            刷新健康探针
          </Button>,
          <Button
            key="apihub"
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate("/api-hub")}
          >
            前往 API 契约集市
          </Button>,
        ],
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* 顶部运行态指标与健康卡片 */}
        <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
          <StatisticCard
            statistic={{
              title: "纳管核心微服务",
              value: MICROSERVICES_CATALOG.length,
              suffix: "个服务",
              description: <Text type="secondary">1 网关 BFF + 4 gRPC 业务微服务</Text>,
              icon: <ClusterOutlined style={{ color: "#722ed1", fontSize: 32 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: "实时运行健康度",
              value: `${healthyCount}/${MICROSERVICES_CATALOG.length}`,
              suffix: "在线",
              status: healthyCount === MICROSERVICES_CATALOG.length ? "success" : "warning",
              description: <Text type="secondary">Nacos 租约心跳 & 端口探针正常</Text>,
              icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 32 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: "调用协议矩阵",
              value: "2",
              suffix: "类协议",
              description: <Text type="secondary">HTTP RESTful (:8888) + gRPC Protobuf</Text>,
              icon: <ApiOutlined style={{ color: "#1677ff", fontSize: 32 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: "基础设施组件",
              value: INFRA_CATALOG.length,
              suffix: "大持久层/引擎",
              description: <Text type="secondary">MySQL + Redis + Temporal + Nacos</Text>,
              icon: <PartitionOutlined style={{ color: "#fa8c16", fontSize: 32 }} />,
            }}
          />
        </StatisticCard.Group>

        {/* 核心分层架构拓扑图 */}
        <div style={{ marginBottom: 28 }}>
          <TopologyGraph
            selectedNodeId={selectedServiceId}
            onSelectNode={handleSelectNode}
            healthMap={healthMap}
            refreshing={probing}
          />
        </div>

        {/* 微服务资产矩阵卡片集 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <Space align="center" size={8}>
              <Title level={4} style={{ margin: 0 }}>
                微服务软件资产目录 (Microservices Catalog)
              </Title>
              <Tag color="purple">5 个核心服务</Tag>
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                严格遵守边界隔离：仅网关对外暴露 HTTP，内部微服务纯 gRPC 运行，核心领域规则 RPC 闭环
              </Text>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {MICROSERVICES_CATALOG.map((service) => {
              const health = healthMap[service.id];
              const isHealthy = health ? health.status === "healthy" : true;

              return (
                <Col xs={24} md={12} lg={8} key={service.id}>
                  <Card
                    hoverable
                    variant="outlined"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setDrawerOpen(true);
                    }}
                    style={{
                      height: "100%",
                      borderRadius: token.borderRadiusLG,
                      borderLeft: `4px solid ${service.color}`,
                    }}
                    styles={{
                      body: {
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      },
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <Space size={8}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: service.color,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                          }}
                        >
                          {service.type === "gateway" ? <ApiOutlined /> : <ClusterOutlined />}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 14 }}>
                            {service.name}
                          </Text>
                          <div style={{ fontSize: 11, color: "#8c8c8c", fontFamily: "Consolas, monospace" }}>
                            {service.code}
                          </div>
                        </div>
                      </Space>

                      <Badge
                        status={isHealthy ? "success" : "error"}
                        text={
                          <Text style={{ fontSize: 11, color: isHealthy ? "#52c41a" : "#ff4d4f" }}>
                            {isHealthy ? "在线" : "离线"}
                          </Text>
                        }
                      />
                    </div>

                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ fontSize: 12, minHeight: 36, marginBottom: 12 }}
                    >
                      {service.domain}
                    </Paragraph>

                    <div style={{ marginBottom: 12 }}>
                      <Space size={6} wrap>
                        <Tag color={service.type === "gateway" ? "purple" : "blue"} style={{ margin: 0, fontSize: 11 }}>
                          {service.protocol}
                        </Tag>
                        <Tag color="cyan" style={{ margin: 0, fontSize: 11 }}>
                          端口: {service.port}
                        </Tag>
                        <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                          {service.owner}
                        </Tag>
                      </Space>
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        borderTop: `1px dashed ${token.colorBorderSecondary}`,
                        paddingTop: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        上游: {service.upstreamIds.length} | 下游: {service.downstreamIds.length}
                      </Text>

                      <Button
                        type="link"
                        size="small"
                        icon={<ArrowRightOutlined />}
                        style={{ padding: 0, fontSize: 12 }}
                      >
                        资产详情
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>

        {/* 基础设施与持久层资产目录 */}
        <div style={{ marginBottom: 28 }}>
          <InfraCatalog
            onSelectInfra={(id) => {
              setSelectedServiceId(id);
            }}
          />
        </div>

        {/* 微服务元数据抽屉 */}
        <ServiceDetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          service={selectedService}
          health={selectedService ? healthMap[selectedService.id] : undefined}
          onJumpToApiHub={handleJumpToApiHub}
        />
      </div>
    </PageContainer>
  );
};

export default ServicesPage;
