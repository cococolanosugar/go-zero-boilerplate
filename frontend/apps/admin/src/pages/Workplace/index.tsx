import React, { useMemo } from "react";
import {
  Row,
  Col,
  Avatar,
  Typography,
  Space,
  Statistic,
  Tag,
  Button,
  Flex,
} from "antd";
import {
  PageContainer,
  ProCard,
} from "@ant-design/pro-components";
import {
  ProjectOutlined,
  TeamOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  ShoppingCartOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  BookOutlined,
  HistoryOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useInitialState } from "../../contexts/InitialStateContext";
import { useIntl } from "../../contexts/LocaleContext";

const { Title, Paragraph, Text } = Typography;

export const WorkplacePage: React.FC = () => {
  const { initialState } = useInitialState();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const currentUser = initialState?.currentUser;

  // 问候语生成
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "凌晨好";
    if (hour < 9) return "早上好";
    if (hour < 12) return "上午好";
    if (hour < 14) return "中午好";
    if (hour < 17) return "下午好";
    if (hour < 19) return "傍晚好";
    return "晚上好";
  }, []);

  const projects = [
    {
      id: 1,
      title: "Gateway BFF",
      desc: "统一对外 HTTP RESTful API 入口，聚合 gRPC 下游与 RBAC 动态鉴权",
      updatedAt: "10 分钟前",
      group: "微服务架构",
      color: "blue",
    },
    {
      id: 2,
      title: "User RPC Service",
      desc: "用户与员工微服务，承载 JWT 颁发、账号治理与 5 级数据权限模型",
      updatedAt: "30 分钟前",
      group: "核心中台",
      color: "purple",
    },
    {
      id: 3,
      title: "Order RPC Service",
      desc: "订单事务微服务，支持分布式订单流转与 Cash-Aside 缓存防击穿",
      updatedAt: "1 小时前",
      group: "业务服务",
      color: "green",
    },
    {
      id: 4,
      title: "Admin Portal",
      desc: "企业级后台系统，集成 Ant Design 6、多标签页与动态色板",
      updatedAt: "2 小时前",
      group: "前端工程",
      color: "cyan",
    },
    {
      id: 5,
      title: "Public Portal",
      desc: "官方门户系统，集成多语言国际化与产品展示落地页",
      updatedAt: "4 小时前",
      group: "前端工程",
      color: "geekblue",
    },
    {
      id: 6,
      title: "OpenAPI & SDK",
      desc: "IDL 契约驱动全自动生成 @zero/api 强类型全栈客户端",
      updatedAt: "1 天前",
      group: "研发效能",
      color: "orange",
    },
  ];

  const activities = [
    {
      id: 1,
      user: "超级管理员",
      action: "发布了",
      project: "统一网关 v1.10.3 生产构建",
      time: "5 分钟前",
    },
    {
      id: 2,
      user: "架构师",
      action: "更新了",
      project: "微服务 RBAC 权限联动模型",
      time: "25 分钟前",
    },
    {
      id: 3,
      user: "安全运维",
      action: "执行了",
      project: "全量双日志审计安全巡检",
      time: "1 小时前",
    },
    {
      id: 4,
      user: "前端工程师",
      action: "重构了",
      project: "Ant Design 6 语义化 Design Tokens",
      time: "2 小时前",
    },
  ];

  const quickLinks = [
    { title: "组织机构", path: "/org/dept", icon: <ApartmentOutlined /> },
    { title: "员工治理", path: "/org/users", icon: <TeamOutlined /> },
    { title: "角色权限", path: "/permission/roles", icon: <SafetyCertificateOutlined /> },
    { title: "接口字典", path: "/system/apis", icon: <ApiOutlined /> },
    { title: "数据字典", path: "/system/dicts", icon: <BookOutlined /> },
    { title: "审计日志", path: "/monitor/logs", icon: <HistoryOutlined /> },
  ];

  return (
    <PageContainer
      content={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar
              size={68}
              src={currentUser?.avatar}
              style={{ backgroundColor: "#1677ff", fontSize: 28 }}
            >
              {(currentUser?.realName || currentUser?.username || "A").slice(0, 1).toUpperCase()}
            </Avatar>
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                {greeting}，{currentUser?.realName || currentUser?.username || "管理员"}，祝你开心每一天！
              </Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                企业微服务全栈大仓架构系统 · 核心研发架构部
              </Paragraph>
            </div>
          </div>
          <Space size={32}>
            <Statistic title="进行中微服务" value={6} prefix={<CloudServerOutlined />} />
            <Statistic title="团队协同成员" value={18} prefix={<TeamOutlined />} />
            <Statistic title="今日调用频次" value={8642} prefix={<ThunderboltOutlined />} />
          </Space>
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        {/* 左侧主要区域 */}
        <Col xs={24} lg={16}>
          <ProCard
            title="进行中的微服务工程"
            extra={<Button type="link" onClick={() => navigate("/dashboard")}>查看全部看板</Button>}
            headerBordered
            gutter={[16, 16]}
            wrap
          >
            {projects.map((p) => (
              <ProCard
                key={p.id}
                colSpan={{ xs: 24, sm: 12, md: 8 }}
                layout="center"
                bordered
                hoverable
                style={{ height: 160 }}
              >
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 15 }}>{p.title}</Text>
                      <Tag color={p.color}>{p.group}</Tag>
                    </div>
                    <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 0 }}>
                      {p.desc}
                    </Paragraph>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <Text type="secondary">{p.updatedAt}</Text>
                    <ArrowRightOutlined style={{ color: "#1677ff" }} />
                  </div>
                </div>
              </ProCard>
            ))}
          </ProCard>

          <ProCard
            title="动态活动流"
            headerBordered
            style={{ marginTop: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activities.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    paddingBottom: 12,
                  }}
                >
                  <Space>
                    <Avatar style={{ backgroundColor: "#87d068" }} icon={<CheckCircleOutlined />} />
                    <div>
                      <Text strong>{item.user}</Text>
                      <Text style={{ margin: "0 6px" }}>{item.action}</Text>
                      <Text style={{ color: "#1677ff" }}>{item.project}</Text>
                    </div>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                </div>
              ))}
            </div>
          </ProCard>
        </Col>

        {/* 右侧边栏辅助区域 */}
        <Col xs={24} lg={8}>
          <ProCard title="便捷快速导航" headerBordered>
            <Row gutter={[8, 8]}>
              {quickLinks.map((link) => (
                <Col span={8} key={link.title}>
                  <Button
                    block
                    type="dashed"
                    icon={link.icon}
                    onClick={() => navigate(link.path)}
                    style={{ height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {link.title}
                  </Button>
                </Col>
              ))}
            </Row>
          </ProCard>

          <ProCard title="微服务集群健康状态" headerBordered style={{ marginTop: 16 }}>
            <Flex vertical style={{ width: "100%" }} gap={12}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text><CloudServerOutlined style={{ marginRight: 8, color: "#52c41a" }} />Gateway BFF (8888)</Text>
                <Tag color="success">RUNNING</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text><CloudServerOutlined style={{ marginRight: 8, color: "#52c41a" }} />User RPC (8080)</Text>
                <Tag color="success">RUNNING</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text><CloudServerOutlined style={{ marginRight: 8, color: "#52c41a" }} />Order RPC (8081)</Text>
                <Tag color="success">RUNNING</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text><ThunderboltOutlined style={{ marginRight: 8, color: "#1677ff" }} />Nacos / Etcd 注册中心</Text>
                <Tag color="processing">CONNECTED</Tag>
              </div>
            </Flex>
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default WorkplacePage;
