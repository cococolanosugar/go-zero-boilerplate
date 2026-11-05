import React from "react";
import { Row, Col, Card, Typography, Tag, Space, Button, theme } from "antd";
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { INFRA_CATALOG, InfraItemVO } from "./catalogData";

const { Title, Text, Paragraph } = Typography;

interface InfraCatalogProps {
  onSelectInfra?: (id: string) => void;
}

export const InfraCatalog: React.FC<InfraCatalogProps> = ({ onSelectInfra }) => {
  const { token } = theme.useToken();

  const getInfraIcon = (id: string, color: string) => {
    switch (id) {
      case "mysql":
        return <DatabaseOutlined style={{ fontSize: 26, color }} />;
      case "redis":
        return <ThunderboltOutlined style={{ fontSize: 26, color }} />;
      case "temporal":
        return <ClockCircleOutlined style={{ fontSize: 26, color }} />;
      case "nacos":
        return <SafetyCertificateOutlined style={{ fontSize: 26, color }} />;
      default:
        return <DatabaseOutlined style={{ fontSize: 26, color }} />;
    }
  };

  const getWebUrl = (id: string) => {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    switch (id) {
      case "temporal":
        return `http://${hostname}:8233`;
      case "nacos":
        return `http://${hostname}:8848/nacos`;
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space align="center" size={8}>
          <Title level={4} style={{ margin: 0 }}>
            持久层与分布式基础设施资产 (Infrastructure & Middleware)
          </Title>
          <Tag color="cyan">4 大核心组件</Tag>
        </Space>
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            微服务底层强一致持久化、缓存加速、长耗时工作流 Saga 编排与服务寻址中心
          </Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {INFRA_CATALOG.map((item) => {
          const webUrl = getWebUrl(item.id);

          return (
            <Col xs={24} sm={12} lg={6} key={item.id}>
              <Card
                hoverable
                variant="outlined"
                onClick={() => onSelectInfra?.(item.id)}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: token.borderRadiusLG,
                }}
                styles={{
                  body: {
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    padding: 18,
                  },
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getInfraIcon(item.id, item.color)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14 }}>
                      {item.name}
                    </Text>
                    <div>
                      <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                        端口: {item.port}
                      </Tag>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <Tag color="blue" style={{ fontSize: 11, padding: "1px 6px" }}>
                    {item.role}
                  </Tag>
                </div>

                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ fontSize: 12, minHeight: 36, marginBottom: 12 }}
                >
                  {item.description}
                </Paragraph>

                <div style={{ marginTop: "auto" }}>
                  <Space wrap size={[4, 6]} style={{ marginBottom: 12 }}>
                    {item.tags.map((t) => (
                      <Tag key={t} style={{ fontSize: 11, margin: 0 }}>
                        {t}
                      </Tag>
                    ))}
                  </Space>

                  {webUrl && (
                    <div style={{ borderTop: `1px dashed ${token.colorBorderSecondary}`, paddingTop: 8 }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<ExportOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(webUrl, "_blank");
                        }}
                        style={{ padding: 0, fontSize: 12 }}
                      >
                        打开 Web 控制台
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default InfraCatalog;
