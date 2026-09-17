import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Slider,
  Table,
  Tabs,
  Space,
  Button,
  Tag,
  Typography,
  Divider,
  App as AntdApp,
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export interface FormFieldDefinition {
  name: string;
  title: string;
  type?: string;
}

export interface BpmnPropertiesDrawerProps {
  open: boolean;
  onClose: () => void;
  element: any;
  modeler: any;
  formFields?: FormFieldDefinition[];
  onPropertiesChange?: (elementId: string, properties: any) => void;
}

export const BpmnPropertiesDrawer: React.FC<BpmnPropertiesDrawerProps> = ({
  open,
  onClose,
  element,
  modeler,
  formFields = [
    { name: 'title', title: '工单标题', type: 'string' },
    { name: 'priority', title: '优先级', type: 'select' },
    { name: 'description', title: '问题与需求详述', type: 'textarea' },
    { name: 'solution', title: '处置方案', type: 'textarea' },
    { name: 'auditOpinion', title: '审批批注', type: 'textarea' },
  ],
  onPropertiesChange,
}) => {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');

  const [fieldPermissions, setFieldPermissions] = useState<
    Record<string, 'writable' | 'readonly' | 'required' | 'hidden'>
  >({});

  useEffect(() => {
    if (!element || !open) return;

    const bo = element.businessObject || {};
    const nodeName = bo.name || '';
    const elementId = element.id || '';
    const elementType = element.type || '';

    // 解析 BPMN documentation 扩展数据
    let docData: any = {};
    if (bo.documentation && bo.documentation.length > 0) {
      try {
        docData = JSON.parse(bo.documentation[0].text);
      } catch (_) {
        // 非 JSON 纯文本忽略
      }
    }

    // 默认字段权限映射
    const initialPerms: Record<string, 'writable' | 'readonly' | 'required' | 'hidden'> = {};
    formFields.forEach((field) => {
      initialPerms[field.name] = docData.fieldPermissions?.[field.name] || 'writable';
    });
    setFieldPermissions(initialPerms);

    // 提取 SequenceFlow condition
    let condition = '';
    if (elementType === 'bpmn:SequenceFlow' && bo.conditionExpression) {
      condition = bo.conditionExpression.body || '';
    }

    form.setFieldsValue({
      id: elementId,
      name: nodeName,
      type: elementType,
      assigneeType: docData.assigneeType || 'SINGLE',
      candidateRoles: docData.candidateRoles || ['ROLE_ADMIN'],
      candidateUsers: docData.candidateUsers || [],
      approvalMode: docData.approvalMode || 'SINGLE',
      passRate: docData.passRate !== undefined ? docData.passRate : 100,
      condition: condition,
    });
  }, [element, open, formFields, form]);

  const handleSave = () => {
    if (!element || !modeler) return;

    form.validateFields().then((values) => {
      try {
        const modeling = modeler.get('modeling');
        const bpmnFactory = modeler.get('bpmnFactory');
        const moddle = modeler.get('moddle');

        // 1. 更新节点基础名称
        modeling.updateProperties(element, {
          name: values.name,
        });

        // 2. 若为连线，更新分支条件
        if (element.type === 'bpmn:SequenceFlow') {
          if (values.condition && values.condition.trim()) {
            const expr = moddle.create('bpmn:FormalExpression', {
              body: values.condition.trim(),
            });
            modeling.updateProperties(element, { conditionExpression: expr });
          } else {
            modeling.updateProperties(element, { conditionExpression: undefined });
          }
        }

        // 3. 若为用户审批任务，更新扩展审批属性与字段权限
        if (element.type === 'bpmn:UserTask') {
          const extensionPayload = {
            assigneeType: values.assigneeType,
            candidateRoles: values.candidateRoles,
            candidateUsers: values.candidateUsers,
            approvalMode: values.approvalMode,
            passRate: values.passRate,
            fieldPermissions: fieldPermissions,
          };

          const documentation = bpmnFactory.create('bpmn:Documentation', {
            text: JSON.stringify(extensionPayload),
          });
          modeling.updateProperties(element, {
            documentation: [documentation],
          });

          onPropertiesChange?.(element.id, extensionPayload);
        }

        message.success('节点属性配置已同步至流程模型');
        onClose();
      } catch (err: any) {
        console.error('[BpmnPropertiesDrawer] Save error', err);
        message.error(`保存节点属性失败: ${err.message || err}`);
      }
    });
  };

  const handlePermissionChange = (
    fieldName: string,
    perm: 'writable' | 'readonly' | 'required' | 'hidden',
  ) => {
    setFieldPermissions((prev) => ({
      ...prev,
      [fieldName]: perm,
    }));
  };

  if (!element) return null;

  const isUserTask = element.type === 'bpmn:UserTask';
  const isSequenceFlow = element.type === 'bpmn:SequenceFlow';

  // 表格列定义
  const permissionColumns = [
    {
      title: '字段名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: FormFieldDefinition) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: '权限控制',
      key: 'permission',
      render: (_: any, record: FormFieldDefinition) => {
        const val = fieldPermissions[record.name] || 'writable';
        return (
          <Radio.Group
            size="small"
            value={val}
            onChange={(e) => handlePermissionChange(record.name, e.target.value)}
          >
            <Radio.Button value="writable">编辑</Radio.Button>
            <Radio.Button value="required">必填</Radio.Button>
            <Radio.Button value="readonly">只读</Radio.Button>
            <Radio.Button value="hidden">隐藏</Radio.Button>
          </Radio.Group>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined />
          <span>节点属性配置</span>
          <Tag color="blue">{element.type?.replace('bpmn:', '')}</Tag>
        </Space>
      }
      placement="right"
      size={480}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: '12px 24px' } }}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="节点标识 (ID)" name="id">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="节点名称"
          name="name"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input placeholder="例如: 部门主管审批" allowClear />
        </Form.Item>

        {isSequenceFlow && (
          <>
            <Divider />
            <Form.Item
              label="流转条件表达式"
              name="condition"
              tooltip="支持 ${approved == true} / ${approved == false} 等表达式"
            >
              <Input.TextArea
                rows={3}
                placeholder="例如: ${approved == true}"
              />
            </Form.Item>
            <Space wrap style={{ marginBottom: 16 }}>
              <Button
                size="small"
                onClick={() => form.setFieldValue('condition', '${approved == true}')}
              >
                + 审批通过
              </Button>
              <Button
                size="small"
                onClick={() => form.setFieldValue('condition', '${approved == false}')}
              >
                + 审批驳回
              </Button>
              <Button
                size="small"
                onClick={() => form.setFieldValue('condition', '${priority == "P1"}')}
              >
                + 高优先级 (P1)
              </Button>
            </Space>
          </>
        )}

        {isUserTask && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'basic',
                label: (
                  <span>
                    <UserOutlined /> 审批人员规则
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 8 }}>
                    <Form.Item
                      label="审批人指派模式"
                      name="assigneeType"
                      rules={[{ required: true }]}
                    >
                      <Radio.Group>
                        <Radio value="SINGLE">指定人员</Radio>
                        <Radio value="ROLE">角色候选</Radio>
                        <Radio value="DEPT_LEADER">部门主管</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) => prev.assigneeType !== cur.assigneeType}
                    >
                      {({ getFieldValue }) => {
                        const type = getFieldValue('assigneeType');
                        if (type === 'ROLE') {
                          return (
                            <Form.Item
                              label="指定候选角色"
                              name="candidateRoles"
                              rules={[{ required: true, message: '请选择候选角色' }]}
                            >
                              <Select
                                mode="multiple"
                                placeholder="选择拥有审批权的角色"
                                options={[
                                  { label: '系统超级管理员 (ROLE_ADMIN)', value: 'ROLE_ADMIN' },
                                  { label: 'IT运维组 (ROLE_IT_OPS)', value: 'ROLE_IT_OPS' },
                                  { label: '信息安全组 (ROLE_SEC)', value: 'ROLE_SEC' },
                                  { label: '部门审批主管 (ROLE_DEPT_LEADER)', value: 'ROLE_DEPT_LEADER' },
                                  { label: '通用普通员工 (ROLE_COMMON)', value: 'ROLE_COMMON' },
                                ]}
                              />
                            </Form.Item>
                          );
                        }
                        if (type === 'SINGLE') {
                          return (
                            <Form.Item
                              label="指定审批工号/用户ID"
                              name="candidateUsers"
                              rules={[{ required: true, message: '请指定审批人' }]}
                            >
                              <Select
                                mode="tags"
                                placeholder="输入用户ID或账号"
                                tokenSeparators={[',']}
                              />
                            </Form.Item>
                          );
                        }
                        return null;
                      }}
                    </Form.Item>

                    <Divider />

                    <Form.Item
                      label="多方审批/会签机制"
                      name="approvalMode"
                      rules={[{ required: true }]}
                    >
                      <Radio.Group>
                        <Radio value="SINGLE">单人办理 (一人办理即可流转)</Radio>
                        <Radio value="OR_SIGN">或签 (任意候选人同意即通过)</Radio>
                        <Radio value="COUNTER_SIGN">会签 (多方共同签署)</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) => prev.approvalMode !== cur.approvalMode}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue('approvalMode') === 'COUNTER_SIGN' ? (
                          <Form.Item
                            label="会签通过阈值比例 (%)"
                            name="passRate"
                          >
                            <Slider
                              min={10}
                              max={100}
                              marks={{
                                50: '50% (半数通过)',
                                80: '80% (绝对多数)',
                                100: '100% (全票通过)',
                              }}
                            />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'permissions',
                label: (
                  <span>
                    <SafetyCertificateOutlined /> 节点字段权限矩阵
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                      配置该审批节点办理人针对工单表单中各个字段的操作权限：
                    </Text>
                    <Table
                      size="small"
                      columns={permissionColumns}
                      dataSource={formFields}
                      rowKey="name"
                      pagination={false}
                      bordered
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </Form>
    </Drawer>
  );
};
