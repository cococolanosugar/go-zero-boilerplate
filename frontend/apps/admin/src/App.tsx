import React, { useState, useEffect } from "react";
import {
  ConfigProvider,
  App as AntdApp,
  Card,
  Tag,
  Button,
  Descriptions,
  Space,
  Avatar,
  Row,
  Col,
  Statistic,
} from "antd";
import { ProLayout, PageContainer } from "@ant-design/pro-components";
import {
  UserOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  login,
  getDashboardOverview,
  setToken,
  getToken,
  type UserInfoResp,
  type OrderDetailResp,
} from "@zero/api";
import { APP_NAME, formatPrice } from "@zero/shared";

const routeConfig = {
  path: "/",
  routes: [
    {
      path: "/dashboard",
      name: "系统仪表盘",
      icon: <DashboardOutlined />,
    },
    {
      path: "/orders",
      name: "订单聚合管理",
      icon: <ShoppingCartOutlined />,
    },
    {
      path: "/users",
      name: "微服务用户",
      icon: <UserOutlined />,
    },
  ],
};

function AdminDashboard() {
  const { message } = AntdApp.useApp();
  const [pathname, setPathname] = useState("/dashboard");
  const [userInfo, setUserInfo] = useState<UserInfoResp | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderDetailResp | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 若本地无 JWT token，自动登录演示账号闭环
      if (!getToken()) {
        const loginRes = await login({ mobile: "13800000000", password: "123456" });
        setToken(loginRes.accessToken);
      }
      // 2. 调用后端基于 go-zero mr.Finish 内网并发聚合微服务数据的接口
      const dashboard = await getDashboardOverview({ orderId: 1001 });
      setUserInfo(dashboard.userInfo);
      setOrderInfo(dashboard.order);
      message.success("数据从后端微服务网关 (JWT 鉴权 + mr.Finish 并发聚合) 同步成功！");
    } catch (err: any) {
      message.error(`网关调用失败: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <ProLayout
        title={APP_NAME}
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        route={routeConfig}
        location={{ pathname }}
        menuItemRender={(item, dom) => (
          <div
            onClick={() => {
              if (item.path) setPathname(item.path);
            }}
          >
            {dom}
          </div>
        )}
        actionsRender={() => [
          <Button
            key="reload"
            type="text"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchData}
          >
            刷新数据
          </Button>,
        ]}
      >
        <PageContainer
          header={{
            title:
              pathname === "/dashboard"
                ? "监控大盘"
                : pathname === "/orders"
                ? "订单聚合详情"
                : "用户中心",
          }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card variant="borderless">
                <Statistic
                  title="微服务网关状态"
                  value="HTTP 8888 在线"
                  styles={{ content: { color: "#3f8600", fontSize: "1.2rem" } }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card variant="borderless">
                <Statistic
                  title="RPC 订单服务"
                  value={orderInfo ? `单号: ${orderInfo.orderId}` : "加载中"}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card variant="borderless">
                <Statistic
                  title="RPC 用户服务"
                  value={userInfo ? userInfo.name : "加载中"}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 24 }}>
            <Card
              title="后端微服务数据联动 (Gateway -> UserRpc + OrderRpc)"
              extra={
                <Space>
                  <Tag color="cyan">Ant Design 6.6.2</Tag>
                  <Tag color="blue">Ant Design Pro Components 2.8.10</Tag>
                </Space>
              }
            >
              {orderInfo && userInfo ? (
                <Descriptions bordered column={2}>
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
                  <Descriptions.Item label="买家姓名">
                    {orderInfo.userName}
                  </Descriptions.Item>
                  <Descriptions.Item label="用户手机号">
                    {userInfo.mobile}
                  </Descriptions.Item>
                  <Descriptions.Item label="数据源调用方式">
                    <Tag color="geekblue">网关内网并发聚合 (mr.Finish)</Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <p>正在拉取微服务数据...</p>
              )}
            </Card>
          </div>
        </PageContainer>
      </ProLayout>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <AdminDashboard />
      </AntdApp>
    </ConfigProvider>
  );
}
