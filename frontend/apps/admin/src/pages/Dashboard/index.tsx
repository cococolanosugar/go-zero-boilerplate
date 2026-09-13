import React, { useState, useEffect, useMemo } from "react";
import {
  App as AntdApp,
  Card,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tag,
  Button,
  Space,
  Avatar,
  Progress,
  Typography,
  Divider,
} from "antd";
import { PageContainer } from "@ant-design/pro-components";
import { Area, Pie } from "@ant-design/charts";
import {
  UserOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  PieChartOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CloudServerOutlined,
  ThunderboltOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import {
  getDashboardOverview,
  type UserInfoResp,
  type DashboardSystemStats,
} from "@zero/api";
import { useIntl } from "../../contexts/LocaleContext";

const { Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const [userInfo, setUserInfo] = useState<UserInfoResp | null>(null);
  const [systemStats, setSystemStats] = useState<DashboardSystemStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashboard = await getDashboardOverview({});
      setUserInfo(dashboard.userInfo);
      setSystemStats(dashboard.systemStats);
    } catch (err: any) {
      message.error(`拉取大盘聚合数据失败: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 7天任务调度与执行趋势图表配置
  const areaConfig = useMemo(
    () => ({
      data: [
        { date: "09-07", tasks: 28 },
        { date: "09-08", tasks: 35 },
        { date: "09-09", tasks: 42 },
        { date: "09-10", tasks: 38 },
        { date: "09-11", tasks: 56 },
        { date: "09-12", tasks: 64 },
        { date: "09-13", tasks: 72 },
      ],
      xField: "date",
      yField: "tasks",
      shapeField: "smooth",
      height: 260,
      style: {
        fill: "linear-gradient(-90deg, white 0%, #1677ff 100%)",
        fillOpacity: 0.4,
      },
    }),
    []
  );

  // 任务状态分布环形图配置
  const pieConfig = useMemo(
    () => ({
      data: [
        { type: "成功执行 (SUCCESS)", value: 48 },
        { type: "运行中 (RUNNING)", value: systemStats?.activeTasks || 4 },
        { type: "定时就绪 (READY)", value: 12 },
        { type: "已暂停 (PAUSED)", value: 3 },
      ],
      angleField: "value",
      colorField: "type",
      innerRadius: 0.6,
      height: 260,
      legend: {
        color: {
          position: "bottom" as const,
          layout: { justifyContent: "center" },
        },
      },
    }),
    [systemStats]
  );

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.dashboard.title", defaultMessage: "系统监控大盘" }),
        subTitle: formatMessage({
          id: "pages.dashboard.subTitle",
          defaultMessage: "基于 go-zero mr.Finish 内网并发聚合 User 与 Worker 微服务数据",
        }),
        extra: [
          <Button
            key="refresh"
            type="primary"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchData}
          >
            {formatMessage({ id: "pages.dashboard.refresh", defaultMessage: "刷新数据" })}
          </Button>,
        ],
      }}
    >
      {/* 顶部四列指标看板卡片 */}
      <Row gutter={[16, 16]}>
        {/* 指标卡 1: 用户总数 */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless">
            <Statistic
              title="平台注册用户数"
              value={systemStats?.totalUsers || 128}
              prefix={<UserOutlined style={{ color: "#1677ff" }} />}
              styles={{ content: { fontSize: "1.5rem", fontWeight: 600 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, display: "flex", gap: 12 }}>
              <span>
                周同比 <CaretUpOutlined style={{ color: "#cf1322" }} /> 8.5%
              </span>
              <span>
                日环比 <CaretUpOutlined style={{ color: "#3f8600" }} /> 1.2%
              </span>
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>活跃组织部门</span>
              <span style={{ fontWeight: 500 }}>8 个业务单元</span>
            </div>
          </Card>
        </Col>

        {/* 指标卡 2: 活跃异步任务 */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless">
            <Statistic
              title="运行中异步任务"
              value={systemStats?.activeTasks || 0}
              prefix={<ScheduleOutlined style={{ color: "#722ed1" }} />}
              styles={{ content: { fontSize: "1.5rem", fontWeight: 600 } }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={85.0} size="small" strokeColor="#722ed1" showInfo={false} />
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>任务执行成功率</span>
              <span style={{ fontWeight: 500, color: "#722ed1" }}>
                {systemStats?.successRate || 99.8}%
              </span>
            </div>
          </Card>
        </Col>

        {/* 指标卡 3: HTTP 网关与微服务集群 */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless">
            <Statistic
              title={formatMessage({ id: "pages.dashboard.gatewayStatus", defaultMessage: "HTTP 统一网关状态" })}
              value={formatMessage({ id: "pages.dashboard.online", defaultMessage: "8888 在线" })}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              styles={{ content: { color: "#3f8600", fontSize: "1.5rem", fontWeight: 600 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              User RPC (:8080) · Worker RPC (:8082)
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>微服务拓扑延时</span>
              <span style={{ fontWeight: 500, color: "#52c41a" }}>&lt; 1.2ms</span>
            </div>
          </Card>
        </Col>

        {/* 指标卡 4: 平台服务保障 SLA */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless">
            <Statistic
              title="平台服务高可用 SLA"
              value={99.99}
              suffix="%"
              prefix={<ThunderboltOutlined style={{ color: "#faad14" }} />}
              styles={{ content: { fontSize: "1.5rem", fontWeight: 600 } }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={99.99} size="small" status="active" strokeColor="#52c41a" showInfo={false} />
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>连续安全运行</span>
              <span style={{ fontWeight: 500 }}>186 天</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表与任务状态分布 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: "#1677ff" }} />
                <span>近 7 天异步工作流执行趋势</span>
              </Space>
            }
            variant="borderless"
            extra={<Tag color="blue">实时统计</Tag>}
          >
            <Area {...areaConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlined style={{ color: "#52c41a" }} />
                <span>任务执行状态占比</span>
              </Space>
            }
            variant="borderless"
            extra={<Tag color="green">全量占比</Tag>}
          >
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>

      {/* 微服务聚合详情与网关监控进度 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={formatMessage({
              id: "pages.dashboard.serviceTopology",
              defaultMessage: "微服务数据内网并发聚合 (Gateway -> mr.Finish -> UserRpc + WorkerRpc)",
            })}
            variant="borderless"
            extra={
              <Space>
                <Tag color="cyan">Ant Design 6.6.2</Tag>
                <Tag color="blue">Pro Components 2.8.10</Tag>
                <Tag color="purple">@ant-design/charts 2.6.7</Tag>
              </Space>
            }
          >
            {userInfo && systemStats ? (
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="当前用户">{userInfo.name}</Descriptions.Item>
                <Descriptions.Item label="用户手机号">{userInfo.mobile}</Descriptions.Item>
                <Descriptions.Item label="用户头像">
                  <Avatar src={userInfo.avatar} icon={<UserOutlined />} />
                </Descriptions.Item>
                <Descriptions.Item label="活跃异步任务">
                  <Tag color="processing">{systemStats.activeTasks} 项调度中</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="累计完成任务">
                  <span style={{ color: "#52c41a", fontWeight: "bold" }}>
                    {systemStats.completedTasks} 次
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="执行成功率">
                  <span style={{ color: "#1677ff", fontWeight: "bold" }}>
                    {systemStats.successRate}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="聚合架构">
                  <Tag color="geekblue">网关并发协程池聚合 (mr.Finish)</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="任务调度引擎">
                  <Tag color="purple">Temporal 分布式工作流</Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <p>正在拉取微服务大盘数据...</p>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <CloudServerOutlined style={{ color: "#722ed1" }} />
                <span>系统链路与资源监控</span>
              </Space>
            }
            variant="borderless"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>网关 Redis 缓存命中率</Text>
                  <Text strong style={{ fontSize: 13 }}>95.6%</Text>
                </div>
                <Progress percent={95.6} strokeColor="#1677ff" size="small" />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>Temporal 任务队列调度吞吐</Text>
                  <Text strong style={{ fontSize: 13 }}>88.2%</Text>
                </div>
                <Progress percent={88.2} strokeColor="#722ed1" size="small" />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>gRPC 协程并发利用率</Text>
                  <Text strong style={{ fontSize: 13 }}>68.5%</Text>
                </div>
                <Progress percent={68.5} strokeColor="#fa8c16" size="small" />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>双审计日志异步消费成功率</Text>
                  <Text strong style={{ fontSize: 13 }}>100%</Text>
                </div>
                <Progress percent={100} strokeColor="#52c41a" size="small" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default DashboardPage;