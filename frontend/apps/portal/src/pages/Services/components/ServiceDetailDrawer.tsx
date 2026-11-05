import React from "react";
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  Space,
  Button,
  Divider,
  Alert,
  Badge,
  App,
} from "antd";
import {
  ApiOutlined,
  CopyOutlined,
  CheckOutlined,
  ClusterOutlined,
  FileTextOutlined,
  TeamOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { ServiceItemVO } from "./catalogData";
import type { ServiceHealthVO } from "./probes";

const { Title, Text, Paragraph } = Typography;

interface ServiceDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  service: ServiceItemVO | null;
  health?: ServiceHealthVO;
  onJumpToApiHub: (tagKey: string) => void;
}

export const ServiceDetailDrawer: React.FC<ServiceDetailDrawerProps> = ({
  open,
  onClose,
  service,
  health,
  onJumpToApiHub,
}) => {
  const { message } = App.useApp();

  if (!service) return null;

  const isHealthy = health ? health.status === "healthy" : true;

  const handleCopy = (text?: string, label: string = "内容") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.success(`已复制 ${label} 到剪贴板`);
  };

  return (
    <Drawer
      title={
        <Space align="center" size={10}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: service.color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            <ClusterOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{service.name}</div>
            <div style={{ fontSize: 12, color: "#8c8c8c", fontFamily: "Consolas, monospace" }}>
              {service.code}
            </div>
          </div>
        </Space>
      }
      placement="right"
      size={580}
      open={open}
      onClose={onClose}
      extra={
        service.apiTagKey && (
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={() => onJumpToApiHub(service.apiTagKey!)}
          >
            调试该服务接口
          </Button>
        )
      }
    >
      {/* 实时健康度概览 */}
      <Alert
        type={isHealthy ? "success" : "warning"}
        showIcon
        title={
          <Space>
            <span>运行态健康探针：</span>
            <Badge status={isHealthy ? "success" : "error"} text={isHealthy ? "在线运行中 (Running)" : "连接等待中 (Waiting)"} />
            {health?.latencyMs !== undefined && (
              <Tag color="green">{health.latencyMs} ms</Tag>
            )}
          </Space>
        }
        description={health?.details || "微服务探针正常维持心跳租约"}
        style={{ marginBottom: 20 }}
      />

      {/* 核心资产元数据详情 */}
      <Descriptions
        title="微服务规格与元数据"
        column={1}
        bordered
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="业务责任边界">
          <Paragraph style={{ margin: 0, fontSize: 13 }}>{service.domain}</Paragraph>
        </Descriptions.Item>

        <Descriptions.Item label="服务架构角色">
          <Space size={8}>
            <Tag color={service.type === "gateway" ? "purple" : "blue"}>
              {service.type === "gateway" ? "统一网关 (BFF)" : "业务微服务 (gRPC RPC)"}
            </Tag>
            <Tag color="cyan">{service.protocol}</Tag>
            <Tag color="geekblue">端口: {service.port}</Tag>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="研发负责团队">
          <Space>
            <TeamOutlined />
            <Text strong>{service.owner}</Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="开发框架与语言">
          <Space>
            <CodeOutlined />
            <Text code>{service.language}</Text>
          </Space>
        </Descriptions.Item>

        {service.protoPath && (
          <Descriptions.Item label="契约源文件 (IDL)">
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Text code style={{ fontSize: 12 }}>
                {service.protoPath}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(service.protoPath, "契约源路径")}
              >
                复制路径
              </Button>
            </Space>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="服务特性标签">
          <Space wrap size={[6, 6]}>
            {service.tags.map((t) => (
              <Tag key={t} color="default" style={{ margin: 0 }}>
                {t}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* 上下游依赖调用关系 */}
      <Title level={5} style={{ marginBottom: 12 }}>
        调用链路与依赖关系 (Dependency Chain)
      </Title>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="上游调用方 (Upstream)">
          <Space wrap>
            {service.upstreamIds.map((u) => (
              <Tag key={u} color="purple">
                ↑ {u}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="下游依赖方 (Downstream)">
          <Space wrap>
            {service.downstreamIds.map((d) => (
              <Tag key={d} color="blue">
                ↓ {d}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* 底部 API Hub 联动引导 */}
      {service.apiTagKey && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f9f0ff",
            borderRadius: 8,
            border: "1px solid #d3adf7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "#531dab", marginBottom: 4 }}>
              前往 API 契约集市即时联调
            </div>
            <div style={{ fontSize: 12, color: "#722ed1" }}>
              查看该服务包含的 OpenAPI 契约、生成多语言 SDK 代码并进行沙箱测试
            </div>
          </div>
          <Button
            type="primary"
            style={{ background: "#722ed1", borderColor: "#722ed1" }}
            icon={<ThunderboltOutlined />}
            onClick={() => onJumpToApiHub(service.apiTagKey!)}
          >
            立即联调
          </Button>
        </div>
      )}
    </Drawer>
  );
};

export default ServiceDetailDrawer;
