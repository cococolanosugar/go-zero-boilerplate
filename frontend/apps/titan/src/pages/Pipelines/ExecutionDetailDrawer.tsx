import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Space,
  Button,
  Descriptions,
  Tag,
  Typography,
  Card,
  Spin,
  App as AntdApp,
  Steps,
  Popconfirm,
  Input,
} from "antd";
import {
  SyncOutlined,
  StopOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import {
  titanGetExecutionDetail,
  titanCancelExecution,
  titanApproveStep,
  titanGetStepLog,
  type TitanGetExecutionDetail200Execution,
  type TitanGetExecutionDetail200StepsItem,
} from "@zero/api";
import { StatusBadge } from "../../components/StatusBadge";
import { TerminalLogViewer } from "../../components/TerminalLogViewer";
import { useIntl } from "../../contexts/LocaleContext";

const { Text } = Typography;

interface ExecutionDetailDrawerProps {
  open: boolean;
  execId: number | null;
  onClose: () => void;
}

export const ExecutionDetailDrawer: React.FC<ExecutionDetailDrawerProps> = ({
  open,
  execId,
  onClose,
}) => {
  const { message } = AntdApp.useApp();
  const { formatMessage: t } = useIntl();
  const [loading, setLoading] = useState(false);
  const [execution, setExecution] = useState<TitanGetExecutionDetail200Execution | null>(null);
  const [steps, setSteps] = useState<TitanGetExecutionDetail200StepsItem[]>([]);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [activeStepLog, setActiveStepLog] = useState<string>("");
  const [logLoading, setLogLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadDetail = async () => {
    if (!execId) return;
    setLoading(true);
    try {
      const res = await titanGetExecutionDetail(execId);
      setExecution(res.execution || null);
      const stepList = res.steps || [];
      setSteps(stepList);

      // 默认选中第一个或正在运行/失败的步骤
      if (stepList.length > 0) {
        const priority =
          stepList.find((s) => s.status === "RUNNING" || s.status === "FAILED") ||
          stepList[stepList.length - 1];
        if (priority?.id && (!activeStepId || !stepList.some((s) => s.id === activeStepId))) {
          setActiveStepId(priority.id);
        }
      }
    } catch (err: any) {
      message.error(err?.message || "获取执行详情失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && execId) {
      loadDetail();
    } else {
      setExecution(null);
      setSteps([]);
      setActiveStepId(null);
      setActiveStepLog("");
    }
  }, [open, execId]);

  // 加载选定步骤的控制台日志
  useEffect(() => {
    if (!execId || !activeStepId) {
      setActiveStepLog("");
      return;
    }
    setLogLoading(true);
    titanGetStepLog(activeStepId, { offset: 0 })
      .then((res) => {
        setActiveStepLog(res.content || "[当前步骤无控制台日志输出]");
      })
      .catch((err) => {
        setActiveStepLog(`[日志拉取失败]: ${err?.message || "未知错误"}`);
      })
      .finally(() => {
        setLogLoading(false);
      });
  }, [execId, activeStepId]);

  const handleCancel = async () => {
    if (!execId) return;
    setCancelling(true);
    try {
      await titanCancelExecution(execId);
      message.success("流水线执行已取消");
      loadDetail();
    } catch (err: any) {
      message.error(err?.message || "取消执行失败");
    } finally {
      setCancelling(false);
    }
  };

  const handleApprove = async (stepId: number) => {
    if (!execId) return;
    try {
      await titanApproveStep(stepId, { approved: true });
      message.success("人工卡点审批通过");
      loadDetail();
    } catch (err: any) {
      message.error(err?.message || "人工卡点审批失败");
    }
  };

  const isRunning = execution?.status === "RUNNING" || execution?.status === "PENDING";

  return (
    <Drawer
      title={
        <Space orientation="horizontal" size={8}>
          <BranchesOutlined style={{ color: "#1890ff" }} />
          <span>流水线执行详情 #{execution?.execNo || execId}</span>
          {execution && <StatusBadge status={execution.status || "PENDING"} />}
        </Space>
      }
      placement="right"
      size={760}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<SyncOutlined />} onClick={loadDetail} loading={loading}>
            刷新
          </Button>
          {isRunning && (
            <Popconfirm
              title="确认强行终止流水线？"
              onConfirm={handleCancel}
              okText="终止"
              cancelText="取消"
            >
              <Button danger icon={<StopOutlined />} loading={cancelling}>
                终止执行
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <Spin spinning={loading}>
        {execution && (
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            {/* 基本元数据 */}
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="流水线名称" span={2}>
                {execution.pipelineName}
              </Descriptions.Item>
              <Descriptions.Item label="Git 分支">
                <Tag color="blue">{execution.gitBranch || "main"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Commit">
                <code>{execution.gitCommit ? execution.gitCommit.slice(0, 7) : "-"}</code>
              </Descriptions.Item>
              <Descriptions.Item label="触发方式">
                <Tag color="purple">{execution.triggerType || "MANUAL"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="耗时">
                {execution.durationMs ? `${(execution.durationMs / 1000).toFixed(1)}s` : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间" span={2}>
                {execution.startTime || "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* 步骤流转导航 */}
            <Card size="small" title="🛠️ 执行步骤链路">
              <Space wrap size={8}>
                {steps.map((step) => {
                  const isSelected = step.id === activeStepId;
                  return (
                    <Button
                      key={step.id}
                      size="small"
                      type={isSelected ? "primary" : "default"}
                      onClick={() => setActiveStepId(step.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <StatusBadge status={step.status || "PENDING"} showText={false} />
                      <span>{step.stepName || step.stepId}</span>
                      {step.durationMs ? (
                        <span style={{ fontSize: 11, opacity: 0.75 }}>
                          {(step.durationMs / 1000).toFixed(0)}s
                        </span>
                      ) : null}
                    </Button>
                  );
                })}
              </Space>

              {/* 卡点审批提醒 */}
              {steps.some((s) => s.id === activeStepId && s.status === "WAITING_APPROVAL") && (
                <div style={{ marginTop: 12, padding: "8px 12px", backgroundColor: "#fffbe6", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="warning">
                    ⚠️ 当前步骤处于人工审批等待状态，需授权后方可继续执行。
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    style={{ backgroundColor: "#52c41a" }}
                    onClick={() => handleApprove(activeStepId!)}
                  >
                    批准放行
                  </Button>
                </div>
              )}
            </Card>

            {/* 终端极客控制台日志 */}
            <div>
              <TerminalLogViewer
                logs={activeStepLog}
                loading={logLoading}
                title={`控制台日志 [步骤: ${steps.find((s) => s.id === activeStepId)?.stepName || activeStepId || "未知"}]`}
                height={400}
              />
            </div>
          </Space>
        )}
      </Spin>
    </Drawer>
  );
};

export default ExecutionDetailDrawer;
