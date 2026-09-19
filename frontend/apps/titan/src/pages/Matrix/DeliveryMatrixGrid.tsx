import React, { useState } from "react";
import { Table, Tag, Tooltip, Space, Typography, Button, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  BranchesOutlined,
  SwapOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  MatrixEnvHeaderVO,
  MatrixServiceRowVO,
  MatrixCellInfoVO,
} from "@zero/api";

const { Text } = Typography;

interface DeliveryMatrixGridProps {
  envs: MatrixEnvHeaderVO[];
  services: MatrixServiceRowVO[];
  loading?: boolean;
  onOpenDiff: (appId: number, appName: string, sourceEnv: string, targetEnv: string) => void;
}

export const DeliveryMatrixGrid: React.FC<DeliveryMatrixGridProps> = ({
  envs,
  services,
  loading = false,
  onOpenDiff,
}) => {
  // 构建动态表格列
  const columns: ColumnsType<MatrixServiceRowVO> = [
    {
      title: "微服务应用",
      key: "service",
      fixed: "left",
      width: 240,
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <AppstoreOutlined style={{ color: "#1890ff" }} />
            <Text strong style={{ fontSize: 13 }}>
              {record.displayName || record.appName}
            </Text>
          </Space>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>
            <code>{record.appName}</code> · 分支: {record.defaultBranch || "main"}
          </div>
        </Space>
      ),
    },
    ...envs.map((env, envIdx) => ({
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{env.envName}</div>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>
            <Tag color="geekblue" style={{ fontSize: 10, margin: "2px 0 0 0" }}>
              {env.envCode?.toUpperCase()}
            </Tag>
            {env.clusterName && <span style={{ marginLeft: 4 }}>({env.clusterName})</span>}
          </div>
        </div>
      ),
      key: `env_${env.envId}`,
      width: 220,
      align: "center" as const,
      render: (_: any, record: MatrixServiceRowVO) => {
        const cell = record.cells?.find((c) => c.envId === env.envId);

        if (!cell || cell.diffStatus === "NOT_DEPLOYED" || !cell.versionTag) {
          return (
            <div style={{ padding: "8px 0", color: "#bfbfbf", fontSize: 12 }}>
              <Text type="secondary">未部署</Text>
              {envIdx > 0 && (
                <div style={{ marginTop: 4 }}>
                  <Button
                    type="link"
                    size="small"
                    icon={<RocketOutlined />}
                    style={{ fontSize: 11, padding: 0 }}
                    onClick={() => {
                      const prevEnv = envs[envIdx - 1];
                      onOpenDiff(record.appId!, record.appName!, prevEnv.envCode!, env.envCode!);
                    }}
                  >
                    从 {envs[envIdx - 1]?.envName} 晋级
                  </Button>
                </div>
              )}
            </div>
          );
        }

        const isBehind = cell.diffStatus === "BEHIND";
        const prevEnv = envIdx > 0 ? envs[envIdx - 1] : null;

        return (
          <div
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              border: isBehind ? "1px dashed #faad14" : "1px solid #f0f0f0",
              backgroundColor: isBehind ? "#fffbe6" : "#fafafa",
              transition: "all 0.2s",
            }}
          >
            {/* 状态与版本 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <StatusBadge status={cell.deployStatus || "RUNNING"} />
              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                {cell.versionTag}
              </Tag>
            </div>

            {/* 副本数与健康指标 */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8c8c8c" }}>
              <span>
                副本: {cell.readyReplicas}/{cell.totalReplicas}
              </span>
              <span>Commit: {cell.gitCommit ? cell.gitCommit.slice(0, 7) : "-"}</span>
            </div>

            {/* 版本差异与晋级操作 */}
            {isBehind && prevEnv && (
              <div style={{ marginTop: 6, borderTop: "1px dashed #ffe58f", paddingTop: 4 }}>
                <Tooltip title={`当前版本落后于 ${prevEnv.envName}，点击查看 Diff 并晋级`}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<SwapOutlined />}
                    style={{ fontSize: 11, height: 22, padding: "0 4px" }}
                    onClick={() => onOpenDiff(record.appId!, record.appName!, prevEnv.envCode!, env.envCode!)}
                  >
                    落后待晋级
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <Table
      columns={columns}
      dataSource={services}
      rowKey="appId"
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ x: 240 + envs.length * 220, y: 600 }}
      bordered
    />
  );
};

export default DeliveryMatrixGrid;
