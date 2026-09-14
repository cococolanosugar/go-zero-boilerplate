import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  App as AntdApp,
  Card,
  Row,
  Col,
  Space,
  Tag,
  Badge,
  Button,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Descriptions,
  Spin,
  Empty,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserSwitchOutlined,
  StopOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  EyeOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  itsmGetTicketDetail,
  itsmGetTicketTrajectory,
  itsmClaimTask,
  itsmApproveTask,
  itsmRejectTask,
  itsmTransferTask,
  itsmCancelTicket,
  type ItsmGetTicketDetail200,
  type ItsmGetTicketTrajectory200,
} from '@zero/api';
import { BpmnViewer } from '../../../components/Bpmn';
import { DynamicTicketForm } from '../../../components/DynamicForm';

const { Text, Paragraph } = Typography;

const actionTypeTagMap: Record<string, { color: string; label: string }> = {
  CREATE: { color: 'cyan', label: '提报发起' },
  CLAIM: { color: 'blue', label: '认领任务' },
  APPROVE: { color: 'green', label: '审批通过' },
  REJECT: { color: 'red', label: '驳回重审' },
  TRANSFER: { color: 'purple', label: '转派处理' },
  CANCEL: { color: 'default', label: '撤回工单' },
};

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message, modal } = AntdApp.useApp();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ItsmGetTicketDetail200 | null>(null);
  const [trajectory, setTrajectory] = useState<ItsmGetTicketTrajectory200 | null>(null);

  // 操作弹窗状态
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  const ticketId = Number(id);

  const loadData = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [detailRes, trajRes] = await Promise.all([
        itsmGetTicketDetail(ticketId),
        itsmGetTicketTrajectory(ticketId),
      ]);
      setDetail(detailRes);
      setTrajectory(trajRes);
    } catch (err: any) {
      message.error(`加载工单详情失败: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ticketId]);

  const activeTask = detail?.activeTasks && detail.activeTasks.length > 0 ? detail.activeTasks[0] : null;

  // 1. 认领任务
  const handleClaim = async () => {
    if (!activeTask) return;
    try {
      await itsmClaimTask(ticketId, { taskId: activeTask.id });
      message.success('任务认领成功');
      loadData();
    } catch (err: any) {
      message.error(`认领失败: ${err.message || err}`);
    }
  };

  // 2. 审批通过
  const handleApprove = async () => {
    if (!activeTask) return;
    try {
      const values = await approveForm.validateFields();
      setSubmitting(true);
      await itsmApproveTask(ticketId, {
        taskId: activeTask.id,
        opinion: values.opinion,
      });
      message.success('工单审批通过，已流转至下一节点');
      setApproveModalOpen(false);
      approveForm.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(`审批失败: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. 驳回
  const handleReject = async () => {
    if (!activeTask) return;
    try {
      const values = await rejectForm.validateFields();
      setSubmitting(true);
      await itsmRejectTask(ticketId, {
        taskId: activeTask.id,
        opinion: values.opinion,
      });
      message.success('工单已驳回');
      setRejectModalOpen(false);
      rejectForm.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(`驳回失败: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. 转派
  const handleTransfer = async () => {
    if (!activeTask) return;
    try {
      const values = await transferForm.validateFields();
      setSubmitting(true);
      await itsmTransferTask(ticketId, {
        taskId: activeTask.id,
        targetUserId: Number(values.targetUserId),
        opinion: values.reason,
      });
      message.success('任务已成功转派');
      setTransferModalOpen(false);
      transferForm.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(`转派失败: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. 撤销工单
  const handleCancel = () => {
    modal.confirm({
      title: '确认撤回此工单？',
      content: '撤回后工单将直接关闭并终止流转，不可恢复。',
      okText: '确认撤回',
      okType: 'danger',
      cancelText: '放弃',
      onOk: async () => {
        try {
          await itsmCancelTicket(ticketId, { reason: '提报人主动撤销' });
          message.success('工单已撤销');
          loadData();
        } catch (err: any) {
          message.error(`撤回工单失败: ${err.message || err}`);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <Card variant="borderless" style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" description="正在加载工单全生命周期视图..." />
        </Card>
      </PageContainer>
    );
  }

  if (!detail || !detail.ticket) {
    return (
      <PageContainer>
        <Card variant="borderless">
          <Empty description="未找到对应的工单数据" />
        </Card>
      </PageContainer>
    );
  }

  const ticket = detail.ticket;
  const isRunning = ticket.status === 'RUNNING';

  // 解析动态表单数据
  let parsedFormData: Record<string, any> = {};
  try {
    parsedFormData = JSON.parse(detail.formDataJson || '{}');
  } catch (_) {}

  return (
    <PageContainer
      title={
        <Space align="center" size={12}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/itsm/tickets')}
          />
          <span>{ticket.title}</span>
          <Tag color="cyan" style={{ fontFamily: 'monospace' }}>
            {ticket.ticketNo}
          </Tag>
        </Space>
      }
      subTitle={`所属流程: ${ticket.procName || '通用IT服务流程'} | 提报时间: ${ticket.createTime}`}
      tags={[
        <Tag key="priority" color={ticket.priority === 'P1' ? 'magenta' : 'blue'}>
          {ticket.priority} 优先级
        </Tag>,
        <Tag key="status" color={isRunning ? 'processing' : 'success'}>
          {ticket.status}
        </Tag>,
        <Tag
          key="sla"
          color={
            ticket.slaStatus === 'TIMEOUT'
              ? 'error'
              : ticket.slaStatus === 'WARNING'
              ? 'warning'
              : 'success'
          }
        >
          SLA: {ticket.slaStatus}
        </Tag>,
      ]}
      extra={[
        isRunning && activeTask && (
          <Button key="claim" onClick={handleClaim}>
            认领任务
          </Button>
        ),
        isRunning && activeTask && (
          <Button
            key="transfer"
            icon={<UserSwitchOutlined />}
            onClick={() => {
              transferForm.resetFields();
              setTransferModalOpen(true);
            }}
          >
            转派
          </Button>
        ),
        isRunning && activeTask && (
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => {
              rejectForm.resetFields();
              setRejectModalOpen(true);
            }}
          >
            驳回
          </Button>
        ),
        isRunning && activeTask && (
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              approveForm.resetFields();
              setApproveModalOpen(true);
            }}
          >
            审批通过
          </Button>
        ),
        isRunning && (
          <Button
            key="cancel"
            type="text"
            danger
            icon={<StopOutlined />}
            onClick={handleCancel}
          >
            撤回工单
          </Button>
        ),
      ]}
    >
      <Row gutter={[16, 16]}>
        {/* 左侧：工单基础信息、动态表单与审批流转日志 */}
        <Col xs={24} lg={14}>
          <Card
            title="工单核心概况与 SLA 时效"
            variant="borderless"
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
              <Descriptions.Item label="当前办理节点">
                <Tag color="processing">{ticket.currentNodeName || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="SLA 响应截止">
                {ticket.slaResponseDeadline || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="SLA 解决截止">
                {ticket.slaResolveDeadline || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title="业务提报详情 (动态表单)"
            variant="borderless"
            style={{ marginBottom: 16 }}
          >
            <DynamicTicketForm
              schema={detail.formSchemaJson}
              initialValues={parsedFormData}
              readonly={true}
            />
          </Card>

          <Card title="流程流转历史与审计日志" variant="borderless">
            {detail.logs && detail.logs.length > 0 ? (
              <Timeline
                mode="left"
                items={detail.logs.map((item) => {
                  const tag = actionTypeTagMap[item.actionType] || {
                    color: 'gray',
                    label: item.actionType,
                  };
                  return {
                    color: tag.color,
                    label: item.createTime,
                    children: (
                      <div>
                        <Space>
                          <Text strong>{item.nodeName}</Text>
                          <Tag color={tag.color}>{tag.label}</Tag>
                          <Text type="secondary">处理人: {item.operatorName}</Text>
                        </Space>
                        {item.opinion && (
                          <Paragraph
                            type="secondary"
                            style={{
                              marginTop: 4,
                              marginBottom: 0,
                              background: 'rgba(0,0,0,0.02)',
                              padding: '4px 8px',
                              borderRadius: 4,
                            }}
                          >
                            批注: {item.opinion}
                          </Paragraph>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <Empty description="暂无流转历史" />
            )}
          </Card>
        </Col>

        {/* 右侧：BPMN 2.0 拓扑轨迹图 */}
        <Col xs={24} lg={10}>
          <Card
            title="BPMN 流程图可视化轨迹追踪"
            variant="borderless"
            extra={
              <Space>
                <Badge color="#52c41a" text="已完成" />
                <Badge color="#1677ff" text="办理中" />
                <Badge color="#ff4d4f" text="驳回" />
              </Space>
            }
          >
            {detail.bpmnXml ? (
              <BpmnViewer
                xml={detail.bpmnXml}
                completedNodeIds={trajectory?.completedNodeIds || []}
                activeNodeIds={trajectory?.activeNodeIds || []}
                rejectedNodeIds={trajectory?.rejectedNodeIds || []}
                logs={detail.logs?.map((l) => ({
                  nodeId: l.nodeId,
                  nodeName: l.nodeName,
                  operatorName: l.operatorName,
                  actionType: l.actionType,
                  opinion: l.opinion,
                  createTime: l.createTime,
                }))}
                height={560}
              />
            ) : (
              <Empty description="该工单流程未绑定 BPMN 流程图" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 审批通过弹窗 */}
      <Modal
        title="审批通过"
        open={approveModalOpen}
        onCancel={() => setApproveModalOpen(false)}
        onOk={handleApprove}
        confirmLoading={submitting}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            label="审批批注意见"
            name="opinion"
            initialValue="同意，核验无误予以通过"
            rules={[{ required: true, message: '请填写审批意见' }]}
          >
            <Input.TextArea rows={4} placeholder="请填写审批批注" />
          </Form.Item>
          <Space wrap>
            <Button
              size="small"
              onClick={() => approveForm.setFieldValue('opinion', '同意，核验无误予以通过')}
            >
              同意
            </Button>
            <Button
              size="small"
              onClick={() =>
                approveForm.setFieldValue('opinion', '方案完备，满足运维规范，准予执行')
              }
            >
              规范完备
            </Button>
            <Button
              size="small"
              onClick={() =>
                approveForm.setFieldValue('opinion', '已在测试环境验证通过，同意发布')
              }
            >
              验证通过
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="驳回工单"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        confirmLoading={submitting}
        okType="danger"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="驳回原因与修改意见"
            name="opinion"
            rules={[{ required: true, message: '请填写驳回原因' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请明确指出不合规项或需要补充的信息"
            />
          </Form.Item>
          <Form.Item label="驳回流转目标节点" name="targetNodeId">
            <Select
              placeholder="默认驳回至提报申请节点 (StartEvent_1)"
              allowClear
              options={[
                { label: '提报申请人 (StartEvent_1)', value: 'StartEvent_1' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 转派弹窗 */}
      <Modal
        title="转派审批任务"
        open={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        onOk={handleTransfer}
        confirmLoading={submitting}
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item
            label="转派目标员工 (用户ID)"
            name="targetUserId"
            rules={[{ required: true, message: '请输入目标员工用户ID' }]}
          >
            <Input placeholder="输入员工工号/用户ID，如 2" />
          </Form.Item>
          <Form.Item
            label="转派原因"
            name="reason"
            rules={[{ required: true, message: '请填写转派原因' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="例如: 涉及专网环境配置，转由专业工程师办理"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TicketDetailPage;
