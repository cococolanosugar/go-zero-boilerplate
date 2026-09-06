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
} from "@ant-design/icons";
import { getDashboardOverview, type UserInfoResp, type OrderDetailResp } from "@zero/api";
import { formatPrice } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";

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
  const areaConfig = useMemo(() => ({
    data: [
      { date: "09-01", revenue: 4200 },
      { date: "09-02", revenue: 5800 },
      { date: "09-03", revenue: 5100 },
      { date: "09-04", revenue: 7600 },
      { date: "09-05", revenue: 9200 },
      { date: "09-06", revenue: 10800 },
      { date: "09-07", revenue: 13500 },
    ],
    xField: "date",
    yField: "revenue",
    shapeField: "smooth",
    height: 260,
    style: {
      fill: "linear-gradient(-90deg, white 0%, #1677ff 100%)",
      fillOpacity: 0.4,
    },
  }), []);

  // 订单状态分布环形图配置
  const pieConfig = useMemo(() => ({
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
  }), []);

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
      {/* 顶部指标卡 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title={formatMessage({ id: "pages.dashboard.gatewayStatus", defaultMessage: "HTTP 统一网关状态" })}
              value={formatMessage({ id: "pages.dashboard.online", defaultMessage: "8888 在线" })}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              styles={{ content: { color: "#3f8600", fontSize: "1.4rem" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Order RPC 微服务"
              value={orderInfo ? `单号: ${orderInfo.orderId}` : "加载中"}
              prefix={<ShoppingCartOutlined style={{ color: "#1677ff" }} />}
              styles={{ content: { fontSize: "1.2rem" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="User RPC 微服务"
              value={userInfo ? userInfo.name : "加载中"}
              prefix={<UserOutlined style={{ color: "#722ed1" }} />}
              styles={{ content: { fontSize: "1.2rem" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Ant Design Pro 风格可视化图表区 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: "#1677ff" }} />
                <span>{formatMessage({ id: "pages.dashboard.orderTrend", defaultMessage: "近 7 天订单与交易额趋势" })}</span>
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
                <span>{formatMessage({ id: "pages.dashboard.statusDistribution", defaultMessage: "订单交易状态分布" })}</span>
              </Space>
            }
            variant="borderless"
            extra={<Tag color="green">全量占比</Tag>}
          >
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>

      {/* 微服务聚合详情卡片 */}
      <div style={{ marginTop: 16 }}>
        <Card
          title={formatMessage({
            id: "pages.dashboard.serviceTopology",
            defaultMessage: "微服务数据内网并发聚合 (Gateway -> mr.Finish -> UserRpc + OrderRpc)",
          })}
          variant="borderless"
          extra={
            <Space>
              <Tag color="cyan">Ant Design 6.6.2</Tag>
              <Tag color="blue">Ant Design Pro Components 2.8.10</Tag>
              <Tag color="purple">@ant-design/charts 2.6.7</Tag>
            </Space>
          }
        >
          {orderInfo && userInfo ? (
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="订单编号">
                {orderInfo.orderId}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color="green">{orderInfo.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="购买商品">
                {orderInfo.item}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: "#cf1322", fontWeight: "bold" }}>
                  {formatPrice(orderInfo.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="买家头像">
                <Avatar src={orderInfo.avatar} icon={<UserOutlined />} />
              </Descriptions.Item>
              <Descriptions.Item label="买家昵称">
                {orderInfo.userName}
              </Descriptions.Item>
              <Descriptions.Item label="用户手机号">
                {userInfo.mobile}
              </Descriptions.Item>
              <Descriptions.Item label="聚合架构">
                <Tag color="geekblue">网关并发协程池聚合 (mr.Finish)</Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <p>正在拉取微服务大盘数据...</p>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;