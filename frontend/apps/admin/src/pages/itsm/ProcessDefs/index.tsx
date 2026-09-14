import React, { useRef, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Drawer,
  Card,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  RocketOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  itsmListProcessDefs,
  itsmCreateProcessDef,
  itsmGetProcessDef,
  itsmUpdateProcessDef,
  itsmDeployProcessDef,
  type ItsmListProcessDefs200ListItem,
} from '@zero/api';
import { BpmnModeler, BpmnPropertiesDrawer } from '../../../components/Bpmn';

export const ProcessDefsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);

  // 基础表单弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editRecord, setEditRecord] = useState<ItsmListProcessDefs200ListItem | null>(null);
  const [baseForm] = Form.useForm();

  // BPMN 设计器抽屉
  const [designerOpen, setDesignerOpen] = useState(false);
  const [currentDef, setCurrentDef] = useState<any>(null);
  const [currentXml, setCurrentXml] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [modelerInstance, setModelerInstance] = useState<any>(null);
  const [propDrawerOpen, setPropDrawerOpen] = useState(false);
  const [savingXml, setSavingXml] = useState(false);

  // 1. 新建/编辑流程基础信息
  const handleOpenCreate = () => {
    setEditRecord(null);
    baseForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (record: ItsmListProcessDefs200ListItem) => {
    setEditRecord(record);
    baseForm.setFieldsValue({
      procCode: record.procCode,
      procName: record.procName,
      category: record.category,
      description: record.description,
    });
    setCreateModalOpen(true);
  };

  const handleBaseSubmit = async () => {
    try {
      const values = await baseForm.validateFields();
      setCreateSubmitting(true);

      if (editRecord) {
        await itsmUpdateProcessDef(editRecord.id, {
          procName: values.procName,
          category: values.category,
          description: values.description,
        });
        message.success('流程信息已更新');
      } else {
        await itsmCreateProcessDef({
          procCode: values.procCode,
          procName: values.procName,
          category: values.category || 'IT_OPS',
          description: values.description || '',
          formSchema: '{}',
        });
        message.success('新服务流程已创建，请点击“可视化设计”配置 BPMN 拓扑');
      }

      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(`保存失败: ${err.message || err}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // 2. 打开 BPMN 可视化设计器
  const handleOpenDesigner = async (record: ItsmListProcessDefs200ListItem) => {
    try {
      const fullDef = await itsmGetProcessDef(record.id);
      setCurrentDef(fullDef);
      setCurrentXml(fullDef.bpmnXml || '');
      setSelectedElement(null);
      setPropDrawerOpen(false);
      setDesignerOpen(true);
    } catch (err: any) {
      message.error(`加载流程定义失败: ${err.message || err}`);
    }
  };

  // 3. 保存 BPMN XML
  const handleSaveXml = async () => {
    if (!currentDef || !currentXml) return;
    setSavingXml(true);
    try {
      await itsmUpdateProcessDef(currentDef.id, {
        procName: currentDef.procName,
        category: currentDef.category,
        description: currentDef.description,
        bpmnXml: currentXml,
        formSchema: currentDef.formSchema,
      });
      message.success('BPMN 流程拓扑已成功保存');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(`保存流程模型失败: ${err.message || err}`);
    } finally {
      setSavingXml(false);
    }
  };

  // 4. 一键发布上线
  const handleDeploy = async (id: number) => {
    try {
      await itsmDeployProcessDef(id);
      message.success('流程已成功校验拓扑并发布上线！');
      actionRef.current?.reload();
      if (designerOpen && currentDef?.id === id) {
        setDesignerOpen(false);
      }
    } catch (err: any) {
      message.error(`发布失败: ${err.message || err}`);
    }
  };

  const columns: ProColumns<ItsmListProcessDefs200ListItem>[] = [
    {
      title: '流程标识编码',
      dataIndex: 'procCode',
      width: 160,
      copyable: true,
      render: (text) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '流程名称',
      dataIndex: 'procName',
      ellipsis: true,
      render: (text, record) => (
        <Space orientation="vertical" size={2}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.description && (
            <span style={{ fontSize: 12, color: '#888' }}>{record.description}</span>
          )}
        </Space>
      ),
    },
    {
      title: '服务分类',
      dataIndex: 'category',
      width: 130,
      valueType: 'select',
      valueEnum: {
        IT_OPS: { text: 'IT运维与变更' },
        FAULT: { text: '故障与报修' },
        SECURITY: { text: '网络与安全' },
        ACCESS: { text: '账号与权限' },
        ASSET: { text: '办公与资产' },
      },
      render: (_, record) => <Tag color="geekblue">{record.category}</Tag>,
    },
    {
      title: '版本号',
      dataIndex: 'version',
      width: 80,
      search: false,
      render: (_, record) => <Tag color="blue">v{record.version}</Tag>,
    },
    {
      title: '流程状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: '草稿', status: 'Warning' },
        2: { text: '已发布', status: 'Success' },
      },
      render: (_, record) =>
        record.status === 2 ? (
          <Tag color="success">已发布上线</Tag>
        ) : (
          <Tag color="gold">草稿待发布</Tag>
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        <Button
          key="designer"
          type="link"
          size="small"
          icon={<ApartmentOutlined />}
          onClick={() => handleOpenDesigner(record)}
        >
          可视化设计
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          编辑
        </Button>,
        record.status !== 2 && (
          <Popconfirm
            key="deploy"
            title="确认发布上线此流程定义？"
            description="发布后将校验 BPMN 拓扑连通性并允许前端提报工单。"
            onConfirm={() => handleDeploy(record.id)}
          >
            <Button type="link" size="small" icon={<RocketOutlined />}>
              发布
            </Button>
          </Popconfirm>
        ),
      ],
    },
  ];

  return (
    <PageContainer
      title="ITSM 流程目录与服务编排"
      subTitle="管理企业 IT 服务目录，基于 BPMN 2.0 可视化设计节点流转、审批角色与表单权限矩阵"
      extra={[
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
        >
          新建服务流程
        </Button>,
      ]}
    >
      <ProTable<ItsmListProcessDefs200ListItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await itsmListProcessDefs({
            page: params.current || 1,
            pageSize: params.pageSize || 10,
            keyword: params.procName || params.procCode,
            category: params.category,
          });
          return {
            data: res.list || [],
            total: res.total || 0,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        cardBordered={false}
      />

      {/* 新建/编辑基础信息弹窗 */}
      <Modal
        title={editRecord ? '编辑服务流程信息' : '新建服务流程'}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleBaseSubmit}
        confirmLoading={createSubmitting}
      >
        <Form form={baseForm} layout="vertical">
          <Form.Item
            label="流程标识编码"
            name="procCode"
            rules={[
              { required: true, message: '请输入流程编码 (如 proc_it_ops)' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字与下划线' },
            ]}
          >
            <Input
              placeholder="例如: proc_prod_db_access"
              disabled={!!editRecord}
            />
          </Form.Item>

          <Form.Item
            label="流程名称"
            name="procName"
            rules={[{ required: true, message: '请输入流程名称' }]}
          >
            <Input placeholder="例如: 生产数据库权限申请与审批" />
          </Form.Item>

          <Form.Item
            label="服务分类"
            name="category"
            initialValue="IT_OPS"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'IT运维与变更 (IT_OPS)', value: 'IT_OPS' },
                { label: '故障与报修 (FAULT)', value: 'FAULT' },
                { label: '网络与安全 (SECURITY)', value: 'SECURITY' },
                { label: '账号与权限 (ACCESS)', value: 'ACCESS' },
                { label: '办公与资产 (ASSET)', value: 'ASSET' },
              ]}
            />
          </Form.Item>

          <Form.Item label="流程简要描述" name="description">
            <Input.TextArea rows={3} placeholder="描述该流程的适用业务场景与审批准则" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 全屏/大尺寸 BPMN 可视化设计器抽屉 */}
      <Drawer
        title={
          <Space>
            <ApartmentOutlined />
            <span>流程建模与属性配置: {currentDef?.procName}</span>
            <Tag color="cyan">{currentDef?.procCode}</Tag>
            <Tag color="blue">v{currentDef?.version}</Tag>
          </Space>
        }
        size="large"
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        styles={{ body: { padding: 0, overflow: 'hidden' }, wrapper: { width: '100%' } }}
        extra={
          <Space>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveXml}
              loading={savingXml}
            >
              保存模型
            </Button>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => handleDeploy(currentDef?.id)}
            >
              保存并发布上线
            </Button>
          </Space>
        }
      >
        {designerOpen && (
          <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)' }}>
            <BpmnModeler
              xml={currentXml}
              onChange={(updatedXml) => setCurrentXml(updatedXml)}
              onSelectElement={(element, modeler) => {
                setSelectedElement(element);
                setModelerInstance(modeler);
                if (element) {
                  setPropDrawerOpen(true);
                } else {
                  setPropDrawerOpen(false);
                }
              }}
              height="calc(100vh - 110px)"
            />

            {/* 节点属性配置侧边抽屉 */}
            <BpmnPropertiesDrawer
              open={propDrawerOpen}
              onClose={() => setPropDrawerOpen(false)}
              element={selectedElement}
              modeler={modelerInstance}
              onPropertiesChange={() => {
                // 属性保存后触发 modeler 内部 commandStack 更新
              }}
            />
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ProcessDefsPage;
