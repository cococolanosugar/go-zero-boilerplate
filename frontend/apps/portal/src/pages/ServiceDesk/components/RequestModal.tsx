import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Typography,
  Space,
  Tag,
  Alert,
  Divider,
  App as AntdApp,
} from 'antd';
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { itsmCreateTicket, type ItsmListProcessDefs200ListItem } from '@zero/api';
import { PRIORITY_CONFIG } from '../types';

const { Text, Paragraph } = Typography;

interface RequestModalProps {
  open: boolean;
  service: ItsmListProcessDefs200ListItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  open,
  service,
  onCancel,
  onSuccess,
}) => {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && service) {
      form.resetFields();
      form.setFieldsValue({
        procDefId: service.id,
        title: `[${service.procName}] 员工自助服务申请`,
        priority: 'P3',
        description: '',
        contactPhone: '',
        extraRemark: '',
      });
    }
  }, [open, service, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!service) return;

      setSubmitting(true);
      const formDataJson = JSON.stringify({
        description: values.description,
        contactPhone: values.contactPhone || '',
        extraRemark: values.extraRemark || '',
        source: 'PORTAL_SELF_SERVICE',
        appliedAt: new Date().toISOString(),
      });

      await itsmCreateTicket({
        procDefId: service.id,
        title: values.title.trim(),
        priority: values.priority,
        formDataJson,
      });

      message.success('工单申请已成功提交！已进入审批流转。');
      onSuccess();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(`提交失败: ${err.message || '系统繁忙，请重试'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#722ed1' }} />
          <span>发起服务申请 - {service?.procName}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="确认并提交申请"
      cancelText="取消"
      width={640}
      destroyOnHidden
    >
      {service && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
          title={
            <Space wrap>
              <Text strong>{service.procName}</Text>
              <Tag color="purple">流程编码: {service.procCode}</Tag>
              <Tag color="blue">SLA响应: 承诺2小时内响应</Tag>
            </Space>
          }
          description={
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
              {service.description || '提交后将由专业 IT 支持团队与对应业务节点流转审批，请如实完整填写申请诉求。'}
            </Paragraph>
          }
          style={{ marginBottom: 20 }}
        />
      )}

      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="title"
          label="工单主题"
          rules={[{ required: true, message: '请输入申请工单主题' }]}
        >
          <Input placeholder="例如: [VPN申请] 开发环境远程访问授权" maxLength={80} showCount />
        </Form.Item>

        <Form.Item
          name="priority"
          label="紧急程度 / 优先级"
          rules={[{ required: true, message: '请选择紧急程度' }]}
        >
          <Radio.Group style={{ width: '100%' }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <Radio key={key} value={key} style={{ width: '100%' }}>
                  <Space>
                    <Tag color={cfg.color}>{cfg.label}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {cfg.desc}
                    </Text>
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>

        <Divider style={{ margin: '16px 0' }} />

        <Form.Item
          name="description"
          label="具体诉求与原因描述"
          rules={[{ required: true, message: '请详细描述您的申请原因或故障现象' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请详细列出申请理由、涉及的系统/硬件、所需使用期限、业务影响等背景，以便审批人快速审核..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item name="contactPhone" label="紧急联系方式（电话/飞书号）">
          <Input placeholder="选填，方便处理人员在有疑问时第一时间与您取得联系" maxLength={30} />
        </Form.Item>

        <Form.Item name="extraRemark" label="补充说明 / 备注">
          <Input.TextArea rows={2} placeholder="如有其他需要特殊说明的事项，请在此补充..." maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RequestModal;
