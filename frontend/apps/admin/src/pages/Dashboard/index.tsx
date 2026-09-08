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
  ShoppingCartOutlined,
  UserOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  PieChartOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CloudServerOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { getDashboardOverview, type UserInfoResp, type OrderDetailResp } from "@zero/api";
import { formatPrice } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";

const { Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const [userInfo, setUserInfo] = useState<UserInfoResp | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderDetailResp | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashboard = await getDashboardOverview({ orderId: 1001 });
      setUserInfo(dashboard.userInfo);
      setOrderInfo(dashboard.order);
    } catch (err: any) {
      message.error(`拉取大盘聚合数据失败: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 7天交易趋势图表配置
  const areaConfig = useMemo(
    () => ({
      data: [
        { date: "09-02", revenue: 4200 },
        { date: "09-03", revenue: 5800 },
        { date: "09-04", revenue: 5100 },
        { date: "09-05", revenue: 7600 },
        { date: "09-06", revenue: 9200 },
        { date: "09-07", revenue: 10800 },
        { date: "09-08", revenue: 13500 },
      ],
      xField: "date",
      yField: "revenue",
      shapeField: "smooth",
      height: 260,
      style: {
        fill: "linear-gradient(-90deg, white 0%, #1677ff 100%)",
        fillOpacity: 0.4,
      },
    }),
    []
  );

  // 订单状态分布环形图配置
  const pieConfig = useMemo(
    () => ({
      data: [
        { type: "已支付 (PAID)", value: 1280 },
        { type: "待支付 (PENDING)", value: 340 },
        { type: "已完成 (COMPLETED)", value: 890 },
        { type: "已取消 (CANCELLED)", value: 110 },
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
    []
  );

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.dashboard.title", defaultMessage: "系统监控大盘" }),
        subTitle: formatMessage({
          id: "pages.dashboard.subTitle",
          defaultMessage: "基于 go-zero mr.Finish 内网并发聚合 User 与 Order 微服务数据",
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
      {/* 顶部四列指标看板卡片 (Pro-Style Metric Cards) */}
      <Row gutter={[16, 16]}>
        {/* 指标卡 1: 总销售交易额 */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless">
            <Statistic
              title="今日交易总额"
              value={126560}
              precision={2}
              prefix="¥"
              styles={{ content: { fontSize: "1.5rem", fontWeight: 600 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, display: "flex", gap: 12 }}>
              <span>
                周同比 <CaretUpOutlined style={{ color: "#cf1322" }} /> 12.5%
              </span>
              <span>
                日环比 <CaretDownOutlined style={{ color: "#3f8600" }} /> 2.1%
              </span>
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>日均销售额</span>
              <span style={{ fontWeight: 500 }}>¥ 18,200</span>
            </div>
          </Card>
        </Col>

        {/* 指标卡 2: 订单聚合总数与转化 */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless">
            <Statistic
              title="聚合订单总量"
              value={orderInfo ? 8846 : 0}
              prefix={<ShoppingCartOutlined style={{ color: "#1677ff" }} />}
              styles={{ content: { fontSize: "1.5rem", fontWeight: 600 } }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={78.4} size="small" strokeColor="#1677ff" showInfo={false} />
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>支付转化率</span>
              <span style={{ fontWeight: 500, color: "#1677ff" }}>78.4%</span>
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
              User RPC (:8080) · Order RPC (:8081)
            </div>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>微服务拓扑延时</span>
              <span style={{ fontWeight: 500, color: "#52c41a" }}>&lt; 1.5ms</span>
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

      {/* 趋势图表与订单分布 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: "#1677ff" }} />
                <span>
                  {formatMessage({
                    id: "pages.dashboard.orderTrend",
                    defaultMessage: "近 7 天订单与交易额趋势",
                  })}
                </span>
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
                <span>
                  {formatMessage({
                    id: "pages.dashboard.statusDistribution",
                    defaultMessage: "订单交易状态分布",
                  })}
                </span>
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
              defaultMessage: "微服务数据内网并发聚合 (Gateway -> mr.Finish -> UserRpc + OrderRpc)",
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
            {orderInfo && userInfo ? (
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="订单编号">{orderInfo.orderId}</Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <Tag color="green">{orderInfo.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="购买商品">{orderInfo.item}</Descriptions.Item>
                <Descriptions.Item label="订单金额">
                  <span style={{ color: "#cf1322", fontWeight: "bold" }}>
                    {formatPrice(orderInfo.amount)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="买家头像">
                  <Avatar src={orderInfo.avatar} icon={<UserOutlined />} />
                </Descriptions.Item>
                <Descriptions.Item label="买家昵称">{orderInfo.userName}</Descriptions.Item>
                <Descriptions.Item label="用户手机号">{userInfo.mobile}</Descriptions.Item>
                <Descriptions.Item label="聚合架构">
                  <Tag color="geekblue">网关并发协程池聚合 (mr.Finish)</Tag>
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
                <span>转化进度与链路指标监控</span>
              </Space>
            }
            variant="borderless"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>网关 Redis 缓存命中率</Text>
                  <Text strong style={{ fontSize: 13 }}>94.2%</Text>
                </div>
                <Progress percent={94.2} strokeColor="#1677ff" size="small" />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>订单全链路结算转化率</Text>
                  <Text strong style={{ fontSize: 13 }}>78.4%</Text>
                </div>
                <Progress percent={78.4} strokeColor="#52c41a" size="small" />
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
                <Progress percent={100} strokeColor="#13c2c2" size="small" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default DashboardPage;