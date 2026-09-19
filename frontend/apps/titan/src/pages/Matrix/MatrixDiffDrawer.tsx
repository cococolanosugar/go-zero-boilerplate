import React, { useEffect, useState } from "react";
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  Timeline,
  Button,
  Space,
  Alert,
  Spin,
  App,
  Card,
  Divider,
} from "antd";
import {
  RocketOutlined,
  SwapRightOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  compareMatrixEnv,
  createReleaseOrder,
  type CompareMatrixEnvRespVO,
} from "@zero/api";

const { Title, Text, Paragraph } = Typography;

interface MatrixDiffDrawerProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  appId: number;
  appName: string;
  sourceEnv: string;
  targetEnv: string;
  onPromoteSuccess?: () => void;
}

export const MatrixDiffDrawer: React.FC<MatrixDiffDrawerProps> = ({
  open,
  onClose,
  projectId,
  appId,
  appName,
  sourceEnv,
  targetEnv,
  onPromoteSuccess,
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [diffData, setDiffData] = useState<CompareMatrixEnvRespVO | null>(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (open && projectId && appId && sourceEnv && targetEnv) {
      loadDiff();
    } else {
      setDiffData(null);
    }
  }, [open, projectId, appId, sourceEnv, targetEnv]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const res = await compareMatrixEnv({
        projectId,
        appId,
        sourceEnv,
        targetEnv,
      });
      setDiffData(res);
    } catch (err: any) {
      message.error(err?.message || "拉取环境版本差异失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!diffData || !diffData.sourceVersion) return;
    setPromoting(true);
    try {
      // 快速创建发布单晋级
      const servicesJson = JSON.stringify([
        {
          appId,
          appName: diffData.appName || appName,
          version: diffData.sourceVersion,
          gitCommit: diffData.sourceCommit,
        },
      ]);
      const res = await createReleaseOrder({
        projectId,
        title: `【一键晋级】${diffData.appName || appName} ${sourceEnv.toUpperCase()} -> ${targetEnv.toUpperCase()}`,
        description: `从 ${sourceEnv} 环境快速晋级版本 ${diffData.sourceVersion} 至 ${targetEnv} 环境`,
        targetEnv,
        servicesJson,
      });

      if (res?.status === "PENDING_APPROVAL") {
        message.warning(`晋级目标为生产环境，已自动提交 ITSM 变更审批流程 (单号: ${res.orderNo})`);
      } else {
        message.success(`晋级发布单创建成功 (单号: ${res.orderNo})，进入执行队列`);
      }

      onPromoteSuccess?.();
      onClose();
    } catch (err: any) {
      message.error(err?.message || "发起晋级失败");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Drawer
      title={
        <Space orientation="horizontal" size={8}>
          <BranchesOutlined style={{ color: "#1890ff" }} />
          <span>跨环境版本对比与一键晋级</span>
        </Space>
      }
      placement="right"
      size={720}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 24 } }}
      extra={
        <Button
          type="primary"
          icon={<RocketOutlined />}
          disabled={!diffData?.canPromote || loading}
          loading={promoting}
          onClick={handlePromote}
        >
          一键晋级至 {targetEnv.toUpperCase()}
        </Button>
      }
    >
      <Spin spinning={loading}>
        {diffData && (
          <Space orientation="vertical" size={20} style={{ width: "100%" }}>
            {/* 环境版本对比看板 */}
            <Card size="small" style={{ backgroundColor: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}>
                  <Tag color="blue" style={{ fontSize: 13, padding: "2px 10px" }}>
                    源环境: {diffData.sourceEnv?.toUpperCase()}
                  </Tag>
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}>
                    {diffData.sourceVersion || <Text type="secondary">未部署</Text>}
                  </div>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                    Commit: {diffData.sourceCommit?.slice(0, 7) || "-"}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <SwapRightOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                  <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 4 }}>
                    {diffData.canPromote ? (
                      <Tag color="warning">待晋级 (BEHIND)</Tag>
                    ) : (
                      <Tag color="success">已对齐 (IN_SYNC)</Tag>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <Tag color="purple" style={{ fontSize: 13, padding: "2px 10px" }}>
                    目标环境: {diffData.targetEnv?.toUpperCase()}
                  </Tag>
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}>
                    {diffData.targetVersion || <Text type="secondary">未部署</Text>}
                  </div>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                    Commit: {diffData.targetCommit?.slice(0, 7) || "-"}
                  </div>
                </div>
              </div>
            </Card>

            {diffData.canPromote ? (
              <Alert
                title="版本待晋级提示"
                description={`源环境 (${diffData.sourceEnv}) 运行最新版本 ${diffData.sourceVersion}，目标环境 (${diffData.targetEnv}) 当前落后，可点击右上角一键发起晋级。`}
                type="info"
                showIcon
              />
            ) : (
              <Alert
                title="环境版本一致"
                description="目标环境当前运行版本与源环境完全一致，无需重复晋级部署。"
                type="success"
                showIcon
              />
            )}

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <Title level={5} style={{ marginBottom: 16 }}>
                📦 增量变更记录 (Commits Diff)
              </Title>
              {diffData.commits && diffData.commits.length > 0 ? (
                <Timeline
                  items={diffData.commits.map((c) => ({
                    color: "blue",
                    dot: <CheckCircleOutlined style={{ fontSize: 14 }} />,
                    children: (
                      <div>
                        <Space>
                          <Tag color="cyan">{c.commitId?.slice(0, 7) || "commit"}</Tag>
                          <Text strong>{c.message}</Text>
                        </Space>
                        <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                          提交人: {c.author} · 提交时间: {c.commitTime}
                        </div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#8c8c8c", padding: "24px 0" }}>
                  暂无 Git 增量 Commit 差异
                </div>
              )}
            </div>
          </Space>
        )}
      </Spin>
    </Drawer>
  );
};

export default MatrixDiffDrawer;
