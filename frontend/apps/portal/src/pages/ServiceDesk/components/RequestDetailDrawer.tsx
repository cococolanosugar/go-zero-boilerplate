import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Spin,
  Descriptions,
  Tag,
  Badge,
  Timeline,
  Space,
  Button,
  Input,
  Modal,
  Alert,
  Divider,
  Typography,
  Card,
  App as AntdApp,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  RollbackOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import {
  itsmGetTicketDetail,
  itsmCancelTicket,
  itsmApproveTask,
  itsmRejectTask,
  type ItsmGetTicketDetail200,
} from '@zero/api';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types';

const { Text, Paragraph } = Typography;

interface RequestDetailDrawerProps {
  open: boolean;
  ticketId: number | null;
  onClose: () => void;
  onRefresh: () => void;
  currentUserId?: number;
}

export const RequestDetailDrawer: React.FC<RequestDetailDrawerProps> = ({
  open,
  ticketId,
  onClose,
  onRefresh,
  currentUserId,
}) => {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ItsmGetTicketDetail200 | null>(null);

  // 撤销弹窗
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // 审批与驳回弹窗
  const [auditAction, setAuditAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [auditComment, setAuditComment] = useState('');
  const [auditTaskId, setAuditTaskId] = useState<number | null>(null);
  const [auditing, setAuditing] = useState(false);

  const fetchDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await itsmGetTicketDetail(id);
      setDetail(res);
    } catch (err: any) {
      message.error(`获取工单详情失败: ${err.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ticketId) {
      fetchDetail(ticketId);
    } else {
      setDetail(null);
    }
  }, [open, ticketId]);

  const handleRevoke = async () => {
    if (!ticketId) return;
    setRevoking(true);
    try {
      await itsmCancelTicket(ticketId, { reason: revokeReason || '发起人主动撤回申请' });
      message.success('已成功撤回该服务申请');
      setRevokeModalOpen(false);
      setRevokeReason('');
      fetchDetail(ticketId);
      onRefresh();
    } catch (err: any) {
      message.error(`撤回失败: ${err.message || '未知错误'}`);
    } finally {
      setRevoking(false);
    }
  };

  const handleAuditSubmit = async () => {
    if (!auditTaskId || !ticketId) return;
    setAuditing(true);
    try {
      if (auditAction === 'APPROVE') {
        await itsmApproveTask(ticketId, {
          taskId: auditTaskId,
          opinion: auditComment || '同意申请',
        });
        message.success('审批通过！流程流转成功');
      } else {
        await itsmRejectTask(ticketId, {
          taskId: auditTaskId,
          opinion: auditComment || '驳回申请',
        });
        message.warning('已驳回该申请');
      }
      setAuditAction(null);
      setAuditComment('');
      setAuditTaskId(null);
      fetchDetail(ticketId);
      onRefresh();
    } catch (err: any) {
      message.error(`处理失败: ${err.message || '未知错误'}`);
    } finally {
      setAuditing(false);
    }
  };

  const ticket = detail?.ticket;
  const activeTasks = detail?.activeTasks || [];
  const logs = detail?.logs || [];

  let formDataObj: Record<string, any> = {};
  if (detail?.formDataJson) {
    try {
      formDataObj = JSON.parse(detail.formDataJson);
    } catch (e) {
      formDataObj = {};
    }
  }

  const canRevoke =
    ticket &&
    (ticket.status === 'RUNNING' || ticket.status === 'PENDING') &&
    (!currentUserId || ticket.initiatorId === currentUserId);

  // 检查当前用户是否有待审批的任务
  const userPendingTask = activeTasks.find(
    (t) => t.status === 'READY' || t.status === 'CLAIMED'
  );

  const statusCfg = ticket?.status ? STATUS_CONFIG[ticket.status] : null;
  const priorityCfg = ticket?.priority ? PRIORITY_CONFIG[ticket.priority] : null;

  return (
    <Drawer
      title={
        <Space>
          <AuditOutlined style={{ color: '#722ed1' }} />
          <span>服务工单详情 #{ticket?.id || ticketId}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={680}
      extra={
        canRevoke && (
          <Button
            danger
            icon={<RollbackOutlined />}
            onClick={() => setRevokeModalOpen(true)}
          >
            撤回申请
          </Button>
        )
      }
    >
      <Spin spinning={loading}>
        {ticket && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* 状态总览 Banner */}
            <Card variant="borderless" style={{ background: '#fafafa', borderRadius: 8 }}>
              <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 16 }}>{ticket.title}</Text>
                  <Space>
                    {priorityCfg && <Tag color={priorityCfg.color}>{priorityCfg.label}</Tag>}
                    {statusCfg && (
                      <Badge
                        status={statusCfg.badgeStatus}
                        text={<Text strong>{statusCfg.label}</Text>}
                      />
                    )}
                  </Space>
                </div>
                <Space wrap style={{ marginTop: 8 }}>
                  <Tag color="purple">流程: {ticket.procName || '通用服务流程'}</Tag>
                  <Tag color="cyan">发起人: {ticket.initiatorName || '企业员工'}</Tag>
                  <Tag color="geekblue">
                    SLA状态: {ticket.slaStatus === 'TIMEOUT' ? '已超时' : '正常履约中'}
                  </Tag>
                </Space>
              </Space>
            </Card>

            {/* 待我审批操作 Bar */}
            {userPendingTask && (
              <Alert
                type="warning"
                showIcon
                title="待您审批处理"
                description={
                  <div style={{ marginTop: 8 }}>
                    <Text>当前节点：{userPendingTask.nodeName}（任务 #{userPendingTask.id}）</Text>
                    <div style={{ marginTop: 12 }}>
                      <Space>
                        <Button
                          type="primary"
                          style={{ background: '#52c41a', borderColor: '#52c41a' }}
                          onClick={() => {
                            setAuditTaskId(userPendingTask.id);
                            setAuditAction('APPROVE');
                          }}
                        >
                          同意通过
                        </Button>
                        <Button
                          danger
                          onClick={() => {
                            setAuditTaskId(userPendingTask.id);
                            setAuditAction('REJECT');
                          }}
                        >
                          驳回申请
                        </Button>
                      </Space>
                    </div>
                  </div>
                }
              />
            )}

            {/* 申请详细数据 */}
            <div>
              <Text strong style={{ fontSize: 14 }}>申请基本信息</Text>
              <Descriptions
                column={2}
                size="small"
                bordered
                style={{ marginTop: 8 }}
                items={[
                  { label: '工单编号', children: `#${ticket.id}` },
                  { label: '服务流程', children: ticket.procName || '-' },
                  { label: '发起时间', children: ticket.createTime || '-' },
                  {
                    label: 'SLA承诺截止',
                    children:
                      ticket.slaResolveDeadline ||
                      ticket.slaResponseDeadline ||
                      '自适应动态SLA',
                  },
                  {
                    label: '诉求与原因',
                    span: 2,
                    children: formDataObj.description || ticket.title || '-',
                  },
                  ...(formDataObj.contactPhone
                    ? [{ label: '紧急联络电话', children: formDataObj.contactPhone }]
                    : []),
                  ...(formDataObj.extraRemark
                    ? [{ label: '补充说明', span: 2, children: formDataObj.extraRemark }]
                    : []),
                ]}
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* 流转进度时间线 */}
            <div>
              <Text strong style={{ fontSize: 14 }}>审批与处理轨迹</Text>
              <div style={{ marginTop: 16, padding: '0 8px' }}>
                <Timeline
                  items={[
                    {
                      color: 'green',
                      dot: <CheckCircleOutlined style={{ fontSize: 14 }} />,
                      children: (
                        <div>
                          <Text strong>发起服务申请</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              由 {ticket.initiatorName || '用户'} 于 {ticket.createTime} 提交
                            </Text>
                          </div>
                        </div>
                      ),
                    },
                    ...logs.map((log, idx) => {
                      let color = 'blue';
                      let icon = <SyncOutlined spin />;
                      if (log.actionType === 'APPROVE') {
                        color = 'green';
                        icon = <CheckCircleOutlined />;
                      } else if (log.actionType === 'REJECT') {
                        color = 'red';
                        icon = <CloseCircleOutlined />;
                      } else if (log.actionType === 'REVOKE') {
                        color = 'gray';
                        icon = <RollbackOutlined />;
                      }

                      return {
                        key: idx,
                        color,
                        dot: icon,
                        children: (
                          <div>
                            <Space wrap>
                              <Text strong>{log.nodeName || '节点处理'}</Text>
                              <Tag color={color}>{log.actionType}</Tag>
                            </Space>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                处理人: {log.operatorName || '系统自动化'} · {log.createTime}
                              </Text>
                            </div>
                            {log.opinion && (
                              <Paragraph
                                type="secondary"
                                style={{
                                  margin: '4px 0 0 0',
                                  background: '#f5f5f5',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  fontSize: 12,
                                }}
                              >
                                批注: {log.opinion}
                              </Paragraph>
                            )}
                          </div>
                        ),
                      };
                    }),
                    ...(activeTasks.length > 0
                      ? activeTasks.map((t) => ({
                          key: `active-${t.id}`,
                          color: 'gold',
                          dot: <ClockCircleOutlined />,
                          children: (
                            <div>
                              <Space wrap>
                                <Text strong>{t.nodeName}</Text>
                                <Tag color="warning">待处理中</Tag>
                              </Space>
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  当前处理人: {t.assigneeName || '待公共认领'}
                                </Text>
                              </div>
                            </div>
                          ),
                        }))
                      : []),
                  ]}
                />
              </div>
            </div>
          </Space>
        )}
      </Spin>

      {/* 撤销确认弹窗 */}
      <Modal
        title="确认撤回申请"
        open={revokeModalOpen}
        onOk={handleRevoke}
        onCancel={() => setRevokeModalOpen(false)}
        confirmLoading={revoking}
        okText="确认撤回"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <Paragraph>撤回后，该申请将被立即终止，审批流将自动关闭。</Paragraph>
        <Input.TextArea
          rows={3}
          placeholder="请输入撤回原因（选填）..."
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
        />
      </Modal>

      {/* 审批批注弹窗 */}
      <Modal
        title={auditAction === 'APPROVE' ? '同意通过申请' : '驳回申请'}
        open={!!auditAction}
        onOk={handleAuditSubmit}
        onCancel={() => {
          setAuditAction(null);
          setAuditComment('');
          setAuditTaskId(null);
        }}
        confirmLoading={auditing}
        okText={auditAction === 'APPROVE' ? '确认同意' : '确认驳回'}
        okButtonProps={auditAction === 'REJECT' ? { danger: true } : {}}
        destroyOnHidden
      >
        <Paragraph>
          {auditAction === 'APPROVE'
            ? '请填写审批意见（默认同意）：'
            : '请详细说明驳回原因，以便申请人修正重新提交：'}
        </Paragraph>
        <Input.TextArea
          rows={3}
          placeholder="请在此输入批注意见..."
          value={auditComment}
          onChange={(e) => setAuditComment(e.target.value)}
        />
      </Modal>
    </Drawer>
  );
};

export default RequestDetailDrawer;
