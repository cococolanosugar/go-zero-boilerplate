import React, { useState, useEffect } from "react";
import {
  Card,
  Segmented,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  RocketOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  MatrixEnvHeaderVO,
  MatrixServiceRowVO,
  MatrixCellInfoVO,
} from "@zero/api";

const { Text } = Typography;

interface DeliveryMatrixMobileCardsProps {
  envs: MatrixEnvHeaderVO[];
  services: MatrixServiceRowVO[];
  loading?: boolean;
  onOpenDiff: (appId: number, appName: string, sourceEnv: string, targetEnv: string) => void;
}

export const DeliveryMatrixMobileCards: React.FC<DeliveryMatrixMobileCardsProps> = ({
  envs,
  services,
  loading = false,
  onOpenDiff,
}) => {
  const [selectedEnvId, setSelectedEnvId] = useState<number | undefined>(() => envs[0]?.envId);

  useEffect(() => {
    if ((selectedEnvId === undefined || !envs.some((e) => e.envId === selectedEnvId)) && envs.length > 0) {
      setSelectedEnvId(envs[0].envId);
    }
  }, [envs, selectedEnvId]);

  const currentEnvIndex = envs.findIndex((e) => e.envId === selectedEnvId);
  const currentEnv = currentEnvIndex >= 0 ? envs[currentEnvIndex] : envs[0];
  const prevEnv = currentEnvIndex > 0 ? envs[currentEnvIndex - 1] : null;

  if (envs.length === 0) {
    return <Empty description="暂无环境定义" style={{ padding: "32px 0" }} />;
  }

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 12 }}>
        {/* 环境分段切换器 */}
        <div style={{ marginBottom: 14 }}>
          <Segmented
            value={selectedEnvId}
            onChange={(val) => setSelectedEnvId(val as number)}
            options={envs.map((env) => ({
              label: (
                <div style={{ padding: "2px 2px", textAlign: "center" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{env.envName}</div>
                  <Tag
                    color="geekblue"
                    style={{
                      fontSize: 10,
                      margin: 0,
                      padding: "0 4px",
                      lineHeight: "16px",
                      transform: "scale(0.9)",
                    }}
                  >
                    {env.envCode?.toUpperCase()}
                  </Tag>
                </div>
              ),
              value: env.envId,
            }))}
            block
          />
        </div>

        {/* 当前环境元数据摘要 */}
        {currentEnv && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: 12,
              borderRadius: 6,
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#595959",
            }}
          >
            <Space size={6}>
              <CloudServerOutlined style={{ color: "#722ed1" }} />
              <span>
                当前环境: <strong>{currentEnv.envName}</strong> ({currentEnv.envCode?.toUpperCase()})
              </span>
            </Space>
            {currentEnv.clusterName && <span>集群: {currentEnv.clusterName}</span>}
          </div>
        )}

        {/* 微服务纵向卡片流 */}
        {services.length === 0 ? (
          <Empty description="暂无微服务交付数据" style={{ padding: "24px 0" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {services.map((service) => {
              const cell = service.cells?.find((c) => c.envId === selectedEnvId);
              const isDeployed = Boolean(cell && cell.diffStatus !== "NOT_DEPLOYED" && cell.versionTag);
              const isBehind = cell?.diffStatus === "BEHIND";

              return (
                <Card
                  key={service.appId}
                  size="small"
                  style={{
                    borderRadius: 8,
                    border: isBehind ? "1px solid #ffe58f" : "1px solid #f0f0f0",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                  }}
                  styles={{
                    header: {
                      padding: "8px 12px",
                      backgroundColor: isBehind ? "rgba(255, 251, 230, 0.4)" : "#fafafa",
                      minHeight: 38,
                    },
                    body: {
                      padding: "10px 12px",
                    },
                  }}
                  title={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Space size={6}>
                        <AppstoreOutlined style={{ color: "#1890ff" }} />
                        <Text strong style={{ fontSize: 13 }}>
                          {service.displayName || service.appName}
                        </Text>
                      </Space>
                      {isDeployed ? (
                        <StatusBadge status={cell?.deployStatus || "RUNNING"} />
                      ) : (
                        <Tag style={{ margin: 0 }}>未部署</Tag>
                      )}
                    </div>
                  }
                >
                  {isDeployed && cell ? (
                    <div>
                      {/* 版本与 Commit */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Space size={6}>
                          <Tag color="blue" style={{ fontSize: 12, margin: 0, fontWeight: 500 }}>
                            {cell.versionTag}
                          </Tag>
                          <Text code style={{ fontSize: 11 }}>
                            {cell.gitCommit ? cell.gitCommit.slice(0, 7) : "-"}
                          </Text>
                        </Space>
                        <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                          Pod 副本: <strong>{cell.readyReplicas ?? 0}</strong>/{cell.totalReplicas ?? 0}
                        </span>
                      </div>

                      {/* 晋级操作或同步状态 */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 8,
                          borderTop: "1px dashed #f0f0f0",
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#8c8c8c" }}>
                          分支: {service.defaultBranch || "main"}
                        </span>

                        {isBehind && prevEnv && (
                          <Button
                            type="primary"
                            ghost
                            danger
                            size="small"
                            icon={<SwapOutlined />}
                            onClick={() =>
                              onOpenDiff(service.appId!, service.appName!, prevEnv.envCode!, currentEnv.envCode!)
                            }
                          >
                            从 {prevEnv.envName} 晋级
                          </Button>
                        )}

                        {!isBehind && prevEnv && (
                          <Space size={4} style={{ color: "#52c41a", fontSize: 12 }}>
                            <CheckCircleOutlined />
                            <span>与上游版本一致</span>
                          </Space>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 0",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        当前服务尚未在此环境部署
                      </Text>
                      {prevEnv && (
                        <Button
                          type="primary"
                          ghost
                          size="small"
                          icon={<RocketOutlined />}
                          onClick={() =>
                            onOpenDiff(service.appId!, service.appName!, prevEnv.envCode!, currentEnv.envCode!)
                          }
                        >
                          从 {prevEnv.envName} 部署
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Spin>
  );
};

export default DeliveryMatrixMobileCards;
