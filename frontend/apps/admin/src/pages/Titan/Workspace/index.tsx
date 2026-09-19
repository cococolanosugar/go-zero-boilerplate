import React from "react";
import { useLocation } from "react-router-dom";
import { Card, Button, Space, Typography, Row, Col, Alert } from "antd";
import {
  RocketOutlined,
  ExportOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";

const { Text, Title } = Typography;

export const TitanWorkspacePage: React.FC = () => {
  const location = useLocation();
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // 根据当前访问路径映射到 Titan 独立工作台的对应路径
  let titanSubPath = "/projects";
  let pageTitle = "Titan 交付项目空间";
  let pageDesc = "全生命周期交付项目管理、多微服务应用空间与跨集群环境资源拓扑";

  if (location.pathname.includes("/apps")) {
    titanSubPath = "/apps";
    pageTitle = "Titan 微服务应用管理";
    pageDesc = "微服务定义、Git 代码仓关联、Dockerfile 编译策略与 Kubernetes 编排模板";
  } else if (location.pathname.includes("/environments")) {
    titanSubPath = "/environments";
    pageTitle = "Titan 环境大盘";
    pageDesc = "对齐 Zadig 核心体验：按环境组织微服务群组，实时掌控 Pod 就绪度与发布制品版本";
  } else if (location.pathname.includes("/artifacts")) {
    titanSubPath = "/artifacts";
    pageTitle = "Titan 不可变制品中心";
    pageDesc = "不可变容器镜像制品库版本追溯、Git Commit 溯源与一键发布部署";
  }

  const titanFullUrl = `http://${host}:3002${titanSubPath}`;

  return (
    <PageContainer
      header={{
        title: pageTitle,
        subTitle: pageDesc,
        extra: [
          <Button
            key="open-standalone"
            type="primary"
            icon={<ExportOutlined />}
            style={{ background: "#1677ff" }}
            onClick={() => window.open(titanFullUrl, "_blank")}
          >
            全屏打开 Titan 独立交付工作台 (:3002)
          </Button>,
        ],
      }}
    >
      <Alert
        title="Titan 研发交付平台已全面演进为微服务云原生独立工作台"
        description="支持项目空间、微服务应用、代码仓绑定、不可变镜像制品与 Kubernetes 多集群发布。您可以在下方直接无缝操作，或点击右上角按钮以全屏独立工作台模式运行。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            hoverable
            onClick={() => window.open(`http://${host}:3002/projects`, "_blank")}
            style={{ cursor: "pointer" }}
          >
            <Space>
              <ProjectOutlined style={{ fontSize: 20, color: "#1677ff" }} />
              <div>
                <Text strong>交付项目空间</Text>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>多微服务与多环境</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            hoverable
            onClick={() => window.open(`http://${host}:3002/apps`, "_blank")}
            style={{ cursor: "pointer" }}
          >
            <Space>
              <AppstoreOutlined style={{ fontSize: 20, color: "#52c41a" }} />
              <div>
                <Text strong>微服务应用</Text>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Git 代码仓与构建配置</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            hoverable
            onClick={() => window.open(`http://${host}:3002/environments`, "_blank")}
            style={{ cursor: "pointer" }}
          >
            <Space>
              <CloudServerOutlined style={{ fontSize: 20, color: "#722ed1" }} />
              <div>
                <Text strong>环境大盘看板</Text>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Pod 副本与运行态监控</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            hoverable
            onClick={() => window.open(`http://${host}:3002/artifacts`, "_blank")}
            style={{ cursor: "pointer" }}
          >
            <Space>
              <RocketOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
              <div>
                <Text strong>不可变制品中心</Text>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>版本库与一键发布分发</div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        styles={{
          body: {
            padding: 0,
            overflow: "hidden",
            borderRadius: 8,
          },
        }}
      >
        <iframe
          title="Titan Standalone Workspace"
          src={titanFullUrl}
          style={{
            width: "100%",
            height: "calc(100vh - 260px)",
            minHeight: 650,
            border: "none",
            display: "block",
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default TitanWorkspacePage;
