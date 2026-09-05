import React, { useState, useEffect } from "react";
import { App as AntdApp, Card, Row, Col, Statistic, Descriptions, Tag, Button, Space, Avatar } from "antd";
import { PageContainer } from "@ant-design/pro-components";
import {
  ShoppingCartOutlined,
  UserOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getDashboardOverview, type UserInfoResp, type OrderDetailResp } from "@zero/api";
import { formatPrice } from "@zero/shared";

export const DashboardPage: React.FC = () => {
  const { message } = AntdApp.useApp();
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

  return (
    <PageContainer
      header={{
        title: "系统监控大盘",
        subTitle: "基于 go-zero mr.Finish 内网并发聚合 User 与 Order 微服务数据",
        extra: [
          <Button
            key="refresh"
            type="primary"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchData}
          >
            刷新数据
          </Button>,
        ],
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="HTTP 统一网关状态"
              value="8888 在线"
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

      <div style={{ marginTop: 24 }}>
        <Card
          title="微服务数据内网并发聚合 (Gateway -> mr.Finish -> UserRpc + OrderRpc)"
          variant="borderless"
          extra={
            <Space>
              <Tag color="cyan">Ant Design 6.6.2</Tag>
              <Tag color="blue">Ant Design Pro Components 2.8.10</Tag>
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