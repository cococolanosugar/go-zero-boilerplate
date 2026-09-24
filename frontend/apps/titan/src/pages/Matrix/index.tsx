import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Space, Button, Typography, Row, Col, Statistic, Alert, App, Grid } from "antd";
import {
  ReloadOutlined,
  DeploymentUnitOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useProject } from "../../contexts/ProjectContext";
import { getDeliveryMatrix, type GetDeliveryMatrixRespVO } from "@zero/api";
import { DeliveryMatrixGrid } from "./DeliveryMatrixGrid";
import { DeliveryMatrixMobileCards } from "./DeliveryMatrixMobileCards";
import { MatrixDiffDrawer } from "./MatrixDiffDrawer";

const { Title, Text } = Typography;

export const DeliveryMatrixPage: React.FC = () => {
  const { currentProjectId, currentProject } = useProject();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md !== "undefined" ? !screens.md : false;
  const [loading, setLoading] = useState(false);
  const [matrixData, setMatrixData] = useState<GetDeliveryMatrixRespVO | null>(null);

  // Diff 抽屉状态
  const [diffDrawerState, setDiffDrawerState] = useState<{
    open: boolean;
    appId: number;
    appName: string;
    sourceEnv: string;
    targetEnv: string;
  }>({
    open: false,
    appId: 0,
    appName: "",
    sourceEnv: "",
    targetEnv: "",
  });

  const loadMatrix = useCallback(async () => {
    if (!currentProjectId) return;
    setLoading(true);
    try {
      const res = await getDeliveryMatrix({ projectId: currentProjectId });
      setMatrixData(res);
    } catch (err: any) {
      message.error(err?.message || "获取交付矩阵大盘数据失败");
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, message]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  // 统计大盘指标
  const metrics = useMemo(() => {
    if (!matrixData) return { totalServices: 0, totalEnvs: 0, behindCount: 0, healthyCount: 0 };
    const totalServices = matrixData.services?.length || 0;
    const totalEnvs = matrixData.envs?.length || 0;
    let behindCount = 0;
    let healthyCount = 0;

    matrixData.services?.forEach((s) => {
      s.cells?.forEach((c) => {
        if (c.diffStatus === "BEHIND") behindCount++;
        if (c.healthStatus === "HEALTHY") healthyCount++;
      });
    });

    return { totalServices, totalEnvs, behindCount, healthyCount };
  }, [matrixData]);

  const handleOpenDiff = (appId: number, appName: string, sourceEnv: string, targetEnv: string) => {
    setDiffDrawerState({
      open: true,
      appId,
      appName,
      sourceEnv,
      targetEnv,
    });
  };

  const handleCloseDiff = () => {
    setDiffDrawerState((prev) => ({ ...prev, open: false }));
  };

  return (
    <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
      {/* 顶部标题与操作 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Space>
          <DeploymentUnitOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <div>
            <Title level={4} style={{ margin: 0, fontSize: isMobile ? 16 : 20 }}>
              全景交付矩阵大盘
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isMobile
                ? "多环境微服务状态与版本差异"
                : "二维全景穿透多环境（DEV/TEST/STAGING/PROD）微服务运行状态与版本差异"}
            </Text>
          </div>
        </Space>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadMatrix} loading={loading}>
            {!isMobile && "刷新大盘"}
          </Button>
        </Space>
      </div>

      {/* 概览统计指标 2x2 响应式网格 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="覆盖微服务"
              value={metrics.totalServices}
              prefix={<AppstoreOutlined style={{ color: "#1890ff" }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="交付环境流"
              value={metrics.totalEnvs}
              prefix={<CloudServerOutlined style={{ color: "#722ed1" }} />}
              suffix="级"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="待晋级版本"
              value={metrics.behindCount}
              styles={{ content: { color: metrics.behindCount > 0 ? "#faad14" : "#52c41a" } }}
              prefix={<ExclamationCircleOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="健康实例"
              value={metrics.healthyCount}
              styles={{ content: { color: "#52c41a" } }}
              prefix={<CheckCircleOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      {/* 矩阵大盘主体：桌面端二维表格 vs 移动端分段器+卡片流 */}
      <Card size="small" styles={{ body: { padding: 0 } }}>
        {screens.md ? (
          <DeliveryMatrixGrid
            envs={matrixData?.envs || []}
            services={matrixData?.services || []}
            loading={loading}
            onOpenDiff={handleOpenDiff}
          />
        ) : (
          <DeliveryMatrixMobileCards
            envs={matrixData?.envs || []}
            services={matrixData?.services || []}
            loading={loading}
            onOpenDiff={handleOpenDiff}
          />
        )}
      </Card>

      {/* 跨环境对比与晋级抽屉 */}
      {currentProjectId && (
        <MatrixDiffDrawer
          open={diffDrawerState.open}
          onClose={handleCloseDiff}
          projectId={currentProjectId}
          appId={diffDrawerState.appId}
          appName={diffDrawerState.appName}
          sourceEnv={diffDrawerState.sourceEnv}
          targetEnv={diffDrawerState.targetEnv}
          onPromoteSuccess={loadMatrix}
        />
      )}
    </div>
  );
};

export default DeliveryMatrixPage;
