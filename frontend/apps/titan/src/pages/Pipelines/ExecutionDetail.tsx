import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  App as AntdApp,
  Card,
  Space,
  Tag,
  Badge,
  Button,
  Row,
  Col,
  Descriptions,
  Typography,
  Steps,
  Alert,
  Input,
  Popconfirm,
  Drawer,
  Spin,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SyncOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  CodeOutlined,
  AuditOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  titanGetExecutionDetail,
  titanCancelExecution,
  titanApproveStep,
  titanGetStepLog,
  type TitanGetExecutionDetail200Execution,
  type TitanGetExecutionDetail200StepsItem,
} from '@zero/api';

const { Text, Title, Paragraph } = Typography;

const statusTagMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  PENDING: { color: 'default', text: '排队就绪', icon: <ClockCircleOutlined /> },
  RUNNING: { color: 'processing', text: '执行中', icon: <SyncOutlined spin /> },
  WAITING_APPROVAL: { color: 'warning', text: '等待人工审批', icon: <ExclamationCircleOutlined /> },
  SUCCESS: { color: 'success', text: '发布成功', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', text: '执行失败', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', text: '已终止', icon: <StopOutlined /> },
};

export const ExecutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const execId = Number(id);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const [loading, setLoading] = useState(true);
  const [execution, setExecution] = useState<TitanGetExecutionDetail200Execution | null>(null);
  const [steps, setSteps] = useState<TitanGetExecutionDetail200StepsItem[]>([]);

  // 选中的步骤与日志查看
  const [selectedStep, setSelectedStep] = useState<TitanGetExecutionDetail200StepsItem | null>(null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // 审批状态
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  const fetchDetail = async () => {
    if (!execId) return;
    try {
      setLoading(true);
      const res = await titanGetExecutionDetail(execId);
      setExecution(res.execution || null);
      setSteps(res.steps || []);
      if (!selectedStep && res.steps && res.steps.length > 0) {
        setSelectedStep(res.steps[0]);
      }
    } catch (err: any) {
      message.error(err?.message || '加载流水线执行详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // 轮询处于 RUNNING 或 WAITING_APPROVAL 状态的任务
    const timer = setInterval(() => {
      if (execution?.status === 'RUNNING' || execution?.status === 'WAITING_APPROVAL') {
        fetchDetail();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [execId, execution?.status]);

  // 获取步骤日志
  const handleOpenLog = async (step: TitanGetExecutionDetail200StepsItem) => {
    setSelectedStep(step);
    setLogDrawerOpen(true);
    setLogLoading(true);
    try {
      const res = await titanGetStepLog(step.id || 0, { offset: 0 });
      setLogContent(res.content || '暂无实时控制台日志输出');
    } catch (err: any) {
      setLogContent(`获取日志失败: ${err?.message || '未知错误'}`);
    } finally {
      setLogLoading(false);
    }
  };

  // 终止执行
  const handleCancel = async () => {
    if (!execId) return;
    try {
      await titanCancelExecution(execId);
      message.success('流水线已发出终止信号');
      fetchDetail();
    } catch (err: any) {
      message.error(err?.message || '终止流水线失败');
    }
  };

  // 审批步骤
  const handleApproval = async (stepId: number, approved: boolean) => {
    try {
      setApprovalSubmitting(true);
      await titanApproveStep(stepId, {
        approved,
        comment: approvalComment,
      });
      message.success(approved ? '门禁已审批通过，流水线继续流转' : '已驳回，流水线终止');
      setApprovalComment('');
      fetchDetail();
    } catch (err: any) {
      message.error(err?.message || '审批操作异常');
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const statusMeta = statusTagMap[execution?.status || 'PENDING'] || statusTagMap.PENDING;

  return (
    <PageContainer
      header={{
        title: (
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/pipelines')}
            />
            <span>流水线执行详情 #{execution?.execNo || execId}</span>
            <Tag color={statusMeta.color} icon={statusMeta.icon} style={{ fontSize: 13, padding: '2px 8px' }}>
              {statusMeta.text}
            </Tag>
          </Space>
        ),
        extra: [
          <Button key="refresh" icon={<SyncOutlined />} onClick={fetchDetail}>
            刷新
          </Button>,
          (execution?.status === 'RUNNING' || execution?.status === 'WAITING_APPROVAL') && (
            <Popconfirm
              key="cancel"
              title="确定立即终止此流水线？"
              description="终止后将向编排引擎发送 Cancel 信号，终止进行中的构建任务。"
              onConfirm={handleCancel}
            >
              <Button danger icon={<StopOutlined />}>
                终止执行
              </Button>
            </Popconfirm>
          ),
        ],
      }}
    >
      <Spin spinning={loading}>
        {/* 执行基础元数据卡片 */}
        <Card variant="outlined" style={{ marginBottom: 16 }}>
          <Descriptions column={{ xs: 1, sm: 2, md: 4 }}>
            <Descriptions.Item label="所属流水线">
              <Text strong>{execution?.pipelineName || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="触发方式">
              <Tag color="cyan">{execution?.triggerType || 'MANUAL'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="代码分支">
              <Space>
                <BranchesOutlined style={{ color: '#1677ff' }} />
                <Text code>{execution?.gitBranch || 'master'}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Commit 提交">
              <Text code>{execution?.gitCommit ? execution.gitCommit.slice(0, 8) : '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {execution?.startTime || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {execution?.endTime || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总计耗时">
              {execution?.durationMs ? `${(execution.durationMs / 1000).toFixed(1)} 秒` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="编排 Workflow ID">
              <Text code copyable ellipsis style={{ maxWidth: 180 }}>
                {execution?.workflowId || '-'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 步骤流转状态时间线 */}
        <Card
          title={
            <Space>
              <PlayCircleOutlined style={{ color: '#1677ff' }} />
              <span>流水线阶段与步骤拓扑状态 (Execution DAG)</span>
            </Space>
          }
          variant="outlined"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((step, index) => {
              const meta = statusTagMap[step.status || 'PENDING'] || statusTagMap.PENDING;
              const isWaiting = step.status === 'WAITING_APPROVAL';

              return (
                <Card
                  key={step.id || index}
                  size="small"
                  variant="outlined"
                  style={{
                    borderColor: isWaiting ? '#faad14' : undefined,
                    background: isWaiting ? '#fffbe6' : '#fafafa',
                  }}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space size="middle">
                        <Tag color="blue">步骤 {index + 1}</Tag>
                        <Text strong style={{ fontSize: 15 }}>
                          {step.stepName}
                        </Text>
                        <Tag color="geekblue">{step.stepType}</Tag>
                        <Tag color={meta.color} icon={meta.icon}>
                          {meta.text}
                        </Tag>
                        {step.durationMs ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            耗时: {(step.durationMs / 1000).toFixed(1)}s
                          </Text>
                        ) : null}
                      </Space>
                    </Col>
                    <Col>
                      <Space>
                        <Button
                          size="small"
                          icon={<FileTextOutlined />}
                          onClick={() => handleOpenLog(step)}
                        >
                          控制台日志
                        </Button>
                      </Space>
                    </Col>
                  </Row>

                  {/* 步骤异常信息 */}
                  {step.errorMsg ? (
                    <Alert
                      title="执行异常中断"
                      description={step.errorMsg}
                      type="error"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  ) : null}

                  {/* 人工卡点审批操作区域 */}
                  {isWaiting && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff', borderRadius: 6, border: '1px solid #ffe58f' }}>
                      <Alert
                        title="人工质量门禁卡点挂起中"
                        description="该流水线包含生产/准入人工审批，请确认灰度验收指标与变更单就绪后进行决策。"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                      />
                      <Input.TextArea
                        rows={2}
                        placeholder="请输入审批审核意见与发布变更单号（可选）..."
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        style={{ marginBottom: 12 }}
                      />
                      <Space>
                        <Button
                          type="primary"
                          style={{ background: '#52c41a', borderColor: '#52c41a' }}
                          loading={approvalSubmitting}
                          onClick={() => step.id && handleApproval(step.id, true)}
                        >
                          同意并推进后续发布 (Approve)
                        </Button>
                        <Popconfirm
                          title="确定驳回发布请求？"
                          description="驳回后流水线将标记为 FAILED 并终止执行！"
                          onConfirm={() => step.id && handleApproval(step.id, false)}
                        >
                          <Button danger loading={approvalSubmitting}>
                            驳回并中止流水线 (Reject)
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      </Spin>

      {/* 步骤日志查看器 Drawer */}
      <Drawer
        title={
          <Space>
            <CodeOutlined style={{ color: '#52c41a' }} />
            <span>实时终端日志: {selectedStep?.stepName}</span>
          </Space>
        }
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        size={780}
        extra={
          <Button
            size="small"
            icon={<SyncOutlined />}
            loading={logLoading}
            onClick={() => selectedStep && handleOpenLog(selectedStep)}
          >
            刷新日志
          </Button>
        }
      >
        <div
          ref={logTerminalRef}
          style={{
            background: '#141414',
            color: '#a6e22e',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 13,
            padding: 16,
            borderRadius: 6,
            minHeight: '80vh',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            lineHeight: 1.6,
          }}
        >
          {logLoading ? <Spin description="正在增量拉取控制台日志..." /> : logContent}
        </div>
      </Drawer>
    </PageContainer>
  );
};

export default ExecutionDetailPage;
