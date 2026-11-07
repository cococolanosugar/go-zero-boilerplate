import React, { useState, useMemo } from "react";
import { theme, Tooltip, Typography, Space, Tag, Badge } from "antd";
import {
  ClusterOutlined,
  ApiOutlined,
  CloudServerOutlined,
  AuditOutlined,
  DeploymentUnitOutlined,
  DatabaseOutlined,
  CheckCircleFilled,
  SyncOutlined,
} from "@ant-design/icons";
import {
  MICROSERVICES_CATALOG,
  INFRA_CATALOG,
  TOPOLOGY_EDGES,
  ServiceItemVO,
  DependencyEdgeVO,
} from "./catalogData";
import type { ServiceHealthVO } from "./probes";

const { Text } = Typography;

interface TopologyNode {
  id: string;
  name: string;
  sub: string;
  layer: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  category: "client" | "gateway" | "rpc" | "infra";
  tags: string[];
}

interface TopologyGraphProps {
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  healthMap: Record<string, ServiceHealthVO>;
  refreshing?: boolean;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  selectedNodeId,
  onSelectNode,
  healthMap,
  refreshing = false,
}) => {
  const { token } = theme.useToken();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 节点几何坐标定义 (viewBox: 0 0 960 520)
  const nodes: TopologyNode[] = useMemo(
    () => [
      // Layer 1: 客户端接入层 (Y: 30)
      {
        id: "portal-client",
        name: "技术门户 (Portal)",
        sub: "React 18 / Vite / :3000",
        layer: 1,
        x: 230,
        y: 25,
        width: 200,
        height: 52,
        color: "#1677ff",
        category: "client",
        tags: ["BFF 消费端", "Web SPA"],
      },
      {
        id: "admin-client",
        name: "管理后台 (Admin)",
        sub: "React 18 / ProLayout / :3001",
        layer: 1,
        x: 530,
        y: 25,
        width: 200,
        height: 52,
        color: "#722ed1",
        category: "client",
        tags: ["RBAC 审计", "全功能管理"],
      },

      // Layer 2: 网关层 (Y: 145)
      {
        id: "gateway",
        name: "统一对外网关 BFF (Gateway)",
        sub: "HTTP RESTful / JWT / RBAC / :8888",
        layer: 2,
        x: 350,
        y: 140,
        width: 260,
        height: 60,
        color: "#722ed1",
        category: "gateway",
        tags: ["对外唯一入口", "mr.Finish 聚合"],
      },

      // Layer 3: gRPC 核心微服务 (Y: 275)
      {
        id: "user-rpc",
        name: "用户中心 (User RPC)",
        sub: "gRPC :8080 · RBAC 权限",
        layer: 3,
        x: 35,
        y: 275,
        width: 200,
        height: 58,
        color: "#1677ff",
        category: "rpc",
        tags: ["双身份画像", "Session 事务"],
      },
      {
        id: "worker-rpc",
        name: "任务调度 (Worker RPC)",
        sub: "gRPC :8082 · Temporal Worker",
        layer: 3,
        x: 265,
        y: 275,
        width: 200,
        height: 58,
        color: "#52c41a",
        category: "rpc",
        tags: ["Temporal Saga", "动态 Cron"],
      },
      {
        id: "itsm-rpc",
        name: "ITSM 流程 (ITSM RPC)",
        sub: "gRPC :8084 · BPMN 2.0 引擎",
        layer: 3,
        x: 495,
        y: 275,
        width: 200,
        height: 58,
        color: "#fa8c16",
        category: "rpc",
        tags: ["BPMN 2.0", "SLA 超时监控"],
      },
      {
        id: "titan-rpc",
        name: "Titan 交付 (Titan RPC)",
        sub: "gRPC :8086 · K8s Helm 编排",
        layer: 3,
        x: 725,
        y: 275,
        width: 200,
        height: 58,
        color: "#13c2c2",
        category: "rpc",
        tags: ["CI/CD 流水线", "K8s Helm"],
      },

      // Layer 4: 基础设施层 (Y: 415)
      {
        id: "mysql",
        name: "MySQL 8.0 持久层",
        sub: "InnoDB 事务强一致 / :3306",
        layer: 4,
        x: 35,
        y: 415,
        width: 200,
        height: 54,
        color: "#00758f",
        category: "infra",
        tags: ["ACID 强一致", "DDL 代码生成"],
      },
      {
        id: "redis",
        name: "Redis 7.0 强一致缓存",
        sub: "Cache-Aside 防击穿 / :6379",
        layer: 4,
        x: 265,
        y: 415,
        width: 200,
        height: 54,
        color: "#dc382d",
        category: "infra",
        tags: ["CachedConn", "精准 Key 淘汰"],
      },
      {
        id: "temporal",
        name: "Temporal 任务引擎",
        sub: "分布式 Saga 编排 / :7233",
        layer: 4,
        x: 495,
        y: 415,
        width: 200,
        height: 54,
        color: "#24292e",
        category: "infra",
        tags: ["状态机流转", "Web: 8233"],
      },
      {
        id: "nacos",
        name: "Nacos 2.x 注册中心",
        sub: "服务租约与配置寻址 / :8848",
        layer: 4,
        x: 725,
        y: 415,
        width: 200,
        height: 54,
        color: "#1890ff",
        category: "infra",
        tags: ["心跳保活", "平滑寻址"],
      },
    ],
    []
  );

  const activeId = hoveredNodeId || selectedNodeId;

  // 判断连线是否高亮
  const isEdgeActive = (edge: DependencyEdgeVO) => {
    if (!activeId) return false;
    return edge.source === activeId || edge.target === activeId;
  };

  // 获取节点中心坐标
  const getNodeCenter = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return { x: 0, y: 0, top: 0, bottom: 0 };
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
      top: node.y,
      bottom: node.y + node.height,
    };
  };

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: "20px 24px",
        boxShadow: token.boxShadowTertiary,
        overflowX: "auto",
      }}
    >
      {/* 拓扑图顶栏图例与说明 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size={16} wrap>
          <Text strong style={{ fontSize: 15 }}>
            微服务全景调用依赖拓扑 (System Topology DAG)
          </Text>
          <Tag color="purple">三层隔离防护体系</Tag>
        </Space>

        <Space size={14} wrap style={{ fontSize: 12 }}>
          <Space size={4}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#52c41a", display: "inline-block" }} />
            <Text type="secondary">健康在线 (Running)</Text>
          </Space>
          <Space size={4}>
            <span style={{ width: 14, height: 2, background: "#1677ff", display: "inline-block" }} />
            <Text type="secondary">gRPC Protobuf</Text>
          </Space>
          <Space size={4}>
            <span style={{ width: 14, height: 2, background: "#722ed1", display: "inline-block" }} />
            <Text type="secondary">HTTP RESTful</Text>
          </Space>
          <Space size={4}>
            <span style={{ width: 14, height: 2, background: "#fa8c16", display: "inline-block" }} />
            <Text type="secondary">MySQL / TCP</Text>
          </Space>
        </Space>
      </div>

      {/* SVG 拓扑画布 */}
      <div style={{ minWidth: 900, position: "relative" }}>
        <svg
          viewBox="0 0 960 495"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            {/* 连线箭头与渐变 */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={token.colorBorder} />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1677ff" />
            </marker>

            {/* 柔和阴影 */}
            <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="125%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.08" />
            </filter>
            <filter id="node-shadow-active" x="-15%" y="-15%" width="130%" height="135%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#1677ff" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 分层虚线指引背景框 */}
          <rect x="15" y="10" width="930" height="80" rx="8" fill={token.colorFillAlter} opacity="0.6" stroke={token.colorBorderSecondary} strokeDasharray="4 4" />
          <text x="30" y="32" fill={token.colorTextTertiary} fontSize="11" fontWeight="600">
            LAYER 1 · 客户端接入层 (Client Apps)
          </text>

          <rect x="15" y="115" width="930" height="110" rx="8" fill={token.colorFillAlter} opacity="0.6" stroke={token.colorBorderSecondary} strokeDasharray="4 4" />
          <text x="30" y="137" fill={token.colorTextTertiary} fontSize="11" fontWeight="600">
            LAYER 2 · 统一对外网关 BFF (Gateway Layer - 流量独占入口)
          </text>

          <rect x="15" y="250" width="930" height="110" rx="8" fill={token.colorFillAlter} opacity="0.6" stroke={token.colorBorderSecondary} strokeDasharray="4 4" />
          <text x="30" y="270" fill={token.colorTextTertiary} fontSize="11" fontWeight="600">
            LAYER 3 · 核心业务微服务集群 (Internal gRPC Services - 纯 RPC 隔离运行)
          </text>

          <rect x="15" y="385" width="930" height="100" rx="8" fill={token.colorFillAlter} opacity="0.6" stroke={token.colorBorderSecondary} strokeDasharray="4 4" />
          <text x="30" y="405" fill={token.colorTextTertiary} fontSize="11" fontWeight="600">
            LAYER 4 · 基础设施与持久层 (Storage & Infrastructure - 强一致保障)
          </text>

          {/* 绘制依赖连线 (Bézier 曲线) */}
          {TOPOLOGY_EDGES.map((edge) => {
            const src = getNodeCenter(edge.source);
            const tgt = getNodeCenter(edge.target);
            const active = isEdgeActive(edge);
            const hasSelection = Boolean(activeId);
            const dimmed = hasSelection && !active;

            const startX = src.x;
            const startY = src.bottom;
            const endX = tgt.x;
            const endY = tgt.top;
            const controlY1 = startY + (endY - startY) * 0.5;
            const controlY2 = startY + (endY - startY) * 0.5;

            const pathD = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

            let strokeColor = token.colorBorder;
            if (active) {
              strokeColor = "#1677ff";
            } else if (edge.protocol === "HTTP/REST") {
              strokeColor = "#722ed1";
            } else if (edge.protocol === "gRPC") {
              strokeColor = "#1677ff";
            } else if (edge.protocol === "TCP") {
              strokeColor = "#fa8c16";
            }

            return (
              <g key={edge.id} opacity={dimmed ? 0.15 : 1} style={{ transition: "opacity 0.25s ease" }}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={edge.protocol === "HTTP/REST" ? "none" : active ? "5 3" : "none"}
                  markerEnd={active ? "url(#arrow-active)" : "url(#arrow-default)"}
                />
              </g>
            );
          })}

          {/* 绘制节点 */}
          {nodes.map((n) => {
            const isSelected = selectedNodeId === n.id;
            const isHovered = hoveredNodeId === n.id;
            const isHighlighted = activeId === n.id;
            const health = healthMap[n.id];
            const isHealthy = health ? health.status === "healthy" : true;

            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onClick={() => onSelectNode(n.id)}
                onMouseEnter={() => setHoveredNodeId(n.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              >
                {/* 节点外框矩形 */}
                <rect
                  width={n.width}
                  height={n.height}
                  rx="8"
                  ry="8"
                  fill={token.colorBgContainer}
                  stroke={isHighlighted ? "#1677ff" : isSelected ? "#722ed1" : token.colorBorderSecondary}
                  strokeWidth={isHighlighted || isSelected ? 2 : 1}
                  filter={isHighlighted ? "url(#node-shadow-active)" : "url(#node-shadow)"}
                />

                {/* 左侧颜色色块饰条 */}
                <rect
                  x="0"
                  y="0"
                  width="5"
                  height={n.height}
                  rx="2"
                  fill={n.color}
                />

                {/* 健康状态指示灯 */}
                {n.category !== "client" && (
                  <circle
                    cx={n.width - 16}
                    cy={16}
                    r="4.5"
                    fill={isHealthy ? "#52c41a" : "#ff4d4f"}
                  />
                )}

                {/* 节点文字信息 */}
                <text
                  x="16"
                  y="24"
                  fill={token.colorText}
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                >
                  {n.name}
                </text>

                <text
                  x="16"
                  y="42"
                  fill={token.colorTextSecondary}
                  fontSize="11"
                  fontFamily="Consolas, Monaco, monospace"
                >
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 底部点击引导提示 */}
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 点击拓扑图中的任意节点，即可高亮其上下游依赖链路并展开该微服务的资产详情与契约调试直达
        </Text>
      </div>
    </div>
  );
};

export default TopologyGraph;
