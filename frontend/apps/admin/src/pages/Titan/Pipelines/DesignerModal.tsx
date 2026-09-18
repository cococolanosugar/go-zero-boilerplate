import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Tabs,
  Tag,
  Divider,
  Typography,
  Radio,
  Tooltip,
  Popconfirm,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CodeOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  CloudUploadOutlined,
  AuditOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import {
  titanCreatePipeline,
  titanUpdatePipeline,
  type TitanListPipelines200ListItem,
} from '@zero/api';

const { Text, Paragraph } = Typography;

export interface DesignerModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  pipeline: TitanListPipelines200ListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export interface PipelineStep {
  id: string;
  name: string;
  type: string;
  params: Record<string, any>;
}

export interface PipelineStage {
  id: string;
  name: string;
  steps: PipelineStep[];
}

const defaultStages: PipelineStage[] = [
  {
    id: 'stage-build',
    name: '代码检出与构建',
    steps: [
      {
        id: 'step-checkout',
        name: 'Git 源码检出',
        type: 'CHECKOUT',
        params: { depth: 1 },
      },
      {
        id: 'step-build-image',
        name: '容器镜像构建与推送',
        type: 'BUILD',
        params: {
          image: 'registry.internal.net/app/service:latest',
          dockerfile: 'Dockerfile',
        },
      },
    ],
  },
  {
    id: 'stage-gate',
    name: '人工卡点审批',
    steps: [
      {
        id: 'step-manual-approval',
        name: '发布上线质量审批',
        type: 'APPROVAL',
        params: { timeoutSeconds: 86400 },
      },
    ],
  },
  {
    id: 'stage-deploy',
    name: 'Kubernetes 部署',
    steps: [
      {
        id: 'step-helm-deploy',
        name: 'Helm Chart 灰度升级',
        type: 'HELM_DEPLOY',
        params: {
          clusterId: 1,
          namespace: 'default',
          releaseName: 'my-service',
          chart: './helm/my-service',
        },
      },
    ],
  },
];

const stepTypeMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CHECKOUT: { label: 'Git 检出', color: 'green', icon: <BranchesOutlined /> },
  BUILD: { label: '容器构建', color: 'blue', icon: <CodeOutlined /> },
  TEST: { label: '测试扫描', color: 'cyan', icon: <ToolOutlined /> },
  JENKINS: { label: 'Jenkins 任务', color: 'geekblue', icon: <ApiOutlined /> },
  HELM_DEPLOY: { label: 'Helm 发布', color: 'volcano', icon: <CloudUploadOutlined /> },
  YAML_DEPLOY: { label: 'K8s YAML 发布', color: 'orange', icon: <CloudUploadOutlined /> },
  APPROVAL: { label: '人工审批卡点', color: 'purple', icon: <AuditOutlined /> },
};

export const DesignerModal: React.FC<DesignerModalProps> = ({
  open,
  mode,
  pipeline,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages);
  const [stagesJson, setStagesJson] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && pipeline) {
        form.setFieldsValue({
          name: pipeline.name,
          displayName: pipeline.displayName,
          category: pipeline.category || 'microservice',
          gitRepo: pipeline.gitRepo,
          gitBranch: pipeline.gitBranch || 'master',
          description: pipeline.description,
          status: pipeline.status,
        });
        try {
          const parsed = JSON.parse(pipeline.stages || '[]');
          setStages(Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultStages);
          setStagesJson(JSON.stringify(parsed, null, 2));
        } catch {
          setStages(defaultStages);
          setStagesJson(JSON.stringify(defaultStages, null, 2));
        }
      } else {
        form.resetFields();
        form.setFieldsValue({
          category: 'microservice',
          gitBranch: 'master',
        });
        setStages(defaultStages);
        setStagesJson(JSON.stringify(defaultStages, null, 2));
      }
    }
  }, [open, mode, pipeline]);

  // 同步 Visual -> JSON
  const handleVisualChange = (newStages: PipelineStage[]) => {
    setStages(newStages);
    setStagesJson(JSON.stringify(newStages, null, 2));
  };

  // 同步 JSON -> Visual
  const handleJsonChange = (rawJson: string) => {
    setStagesJson(rawJson);
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        setStages(parsed);
      }
    } catch {
      // 忽略输入过程中的 JSON 语法暂态错误
    }
  };

  // 添加阶段
  const handleAddStage = () => {
    const stageIdx = stages.length + 1;
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      name: `新编排阶段 ${stageIdx}`,
      steps: [
        {
          id: `step-${Date.now()}`,
          name: '新步骤任务',
          type: 'BUILD',
          params: {},
        },
      ],
    };
    handleVisualChange([...stages, newStage]);
  };

  // 删除阶段
  const handleDeleteStage = (stageIndex: number) => {
    const updated = stages.filter((_, idx) => idx !== stageIndex);
    handleVisualChange(updated);
  };

  // 更新阶段名
  const handleUpdateStageName = (stageIndex: number, newName: string) => {
    const updated = [...stages];
    updated[stageIndex].name = newName;
    handleVisualChange(updated);
  };

  // 向指定阶段添加步骤
  const handleAddStep = (stageIndex: number) => {
    const updated = [...stages];
    const newStep: PipelineStep = {
      id: `step-${Date.now()}`,
      name: '新任务步骤',
      type: 'BUILD',
      params: {},
    };
    updated[stageIndex].steps.push(newStep);
    handleVisualChange(updated);
  };

  // 删除指定步骤
  const handleDeleteStep = (stageIndex: number, stepIndex: number) => {
    const updated = [...stages];
    updated[stageIndex].steps = updated[stageIndex].steps.filter((_, idx) => idx !== stepIndex);
    handleVisualChange(updated);
  };

  // 更新步骤信息
  const handleUpdateStep = (
    stageIndex: number,
    stepIndex: number,
    field: 'name' | 'type' | 'params',
    val: any,
  ) => {
    const updated = [...stages];
    if (field === 'params') {
      try {
        updated[stageIndex].steps[stepIndex].params =
          typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        // preserve
      }
    } else {
      (updated[stageIndex].steps[stepIndex] as any)[field] = val;
    }
    handleVisualChange(updated);
  };

  // 保存流水线
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const stagesPayload = JSON.stringify(stages);

      if (mode === 'create') {
        await titanCreatePipeline({
          name: values.name,
          displayName: values.displayName,
          category: values.category,
          gitRepo: values.gitRepo || '',
          gitBranch: values.gitBranch || 'master',
          stages: stagesPayload,
          params: '[]',
          triggers: '{}',
          description: values.description || '',
        });
      } else if (pipeline?.id) {
        await titanUpdatePipeline(pipeline.id, {
          displayName: values.displayName,
          category: values.category,
          gitRepo: values.gitRepo,
          gitBranch: values.gitBranch,
          stages: stagesPayload,
          params: '[]',
          triggers: '{}',
          status: values.status ?? 1,
          description: values.description,
        });
      }
      onSuccess();
    } catch (err: any) {
      // Form validation errors handled automatically
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '新建 Titan 交付流水线' : `流水线可视化编排: ${pipeline?.displayName || pipeline?.name}`}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={submitting}
      width={960}
      destroyOnHidden
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 8 } }}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="流水线标识 (唯一编码)"
              rules={[{ required: true, message: '请输入流水线标识' }]}
              tooltip="不可变更，通常对应微服务项目代码工程名"
            >
              <Input
                disabled={mode === 'edit'}
                placeholder="例如：order-service-ci, portal-web-pipeline"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="displayName"
              label="显示名称"
              rules={[{ required: true, message: '请输入流水线显示名称' }]}
            >
              <Input placeholder="例如：订单服务持续交付主干线" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="category" label="服务分类">
              <Select
                options={[
                  { label: '后端微服务 (Microservice)', value: 'microservice' },
                  { label: '前端多端应用 (Frontend)', value: 'frontend' },
                  { label: '数据分析/批处理 (Data)', value: 'data' },
                  { label: '其它混合形态 (Other)', value: 'other' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="gitRepo" label="Git 代码仓库地址">
              <Input placeholder="https://github.com/org/repo.git" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="gitBranch" label="默认分支">
              <Input placeholder="master" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="流水线描述说明">
          <Input.TextArea rows={2} placeholder="描述此流水线构建发布的业务范围与通知策略" />
        </Form.Item>

        <Divider titlePlacement="start" style={{ margin: '12px 0 16px' }}>
          <Space>
            <AppstoreOutlined style={{ color: '#1677ff' }} />
            <Text strong>流水线阶段与任务编排 (Stages & Steps)</Text>
          </Space>
        </Divider>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          items={[
            {
              key: 'visual',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>可视化设计器</span>
                </Space>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {stages.map((stage, stageIdx) => (
                    <Card
                      key={stage.id || stageIdx}
                      size="small"
                      variant="outlined"
                      style={{ background: '#fafafa' }}
                      title={
                        <Space>
                          <Tag color="blue">阶段 {stageIdx + 1}</Tag>
                          <Input
                            size="small"
                            value={stage.name}
                            onChange={(e) => handleUpdateStageName(stageIdx, e.target.value)}
                            style={{ width: 220, fontWeight: 'bold' }}
                          />
                        </Space>
                      }
                      extra={
                        <Space>
                          <Button
                            size="small"
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddStep(stageIdx)}
                          >
                            添加步骤
                          </Button>
                          {stages.length > 1 && (
                            <Popconfirm
                              title="确定移除此阶段及内部所有步骤？"
                              onConfirm={() => handleDeleteStage(stageIdx)}
                            >
                              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          )}
                        </Space>
                      }
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stage.steps.map((step, stepIdx) => {
                          const meta = stepTypeMeta[step.type] || {
                            label: step.type,
                            color: 'default',
                            icon: null,
                          };
                          return (
                            <Card
                              key={step.id || stepIdx}
                              size="small"
                              variant="outlined"
                              style={{ background: '#fff' }}
                            >
                              <Row gutter={12} align="middle">
                                <Col span={7}>
                                  <Space.Compact size="small" style={{ width: '100%' }}>
                                    <span style={{ padding: '0 8px', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRight: 0, borderRadius: '4px 0 0 4px', lineHeight: '22px', fontSize: 12, color: '#888' }}>
                                      {stepIdx + 1}.
                                    </span>
                                    <Input
                                      value={step.name}
                                      onChange={(e) =>
                                        handleUpdateStep(stageIdx, stepIdx, 'name', e.target.value)
                                      }
                                    />
                                  </Space.Compact>
                                </Col>
                                <Col span={5}>
                                  <Select
                                    size="small"
                                    style={{ width: '100%' }}
                                    value={step.type}
                                    onChange={(val) =>
                                      handleUpdateStep(stageIdx, stepIdx, 'type', val)
                                    }
                                    options={Object.entries(stepTypeMeta).map(([k, v]) => ({
                                      label: (
                                        <Space size={4}>
                                          {v.icon}
                                          <span>{v.label}</span>
                                        </Space>
                                      ),
                                      value: k,
                                    }))}
                                  />
                                </Col>
                                <Col span={10}>
                                  <Input
                                    size="small"
                                    placeholder={'步骤配置 JSON 参数，如 {"image": "app:v1"}'}
                                    value={
                                      typeof step.params === 'object'
                                        ? JSON.stringify(step.params)
                                        : step.params || '{}'
                                    }
                                    onChange={(e) =>
                                      handleUpdateStep(stageIdx, stepIdx, 'params', e.target.value)
                                    }
                                  />
                                </Col>
                                <Col span={2} style={{ textAlign: 'right' }}>
                                  {stage.steps.length > 1 && (
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleDeleteStep(stageIdx, stepIdx)}
                                    />
                                  )}
                                </Col>
                              </Row>
                            </Card>
                          );
                        })}
                      </div>
                    </Card>
                  ))}

                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={handleAddStage}
                    style={{ height: 40 }}
                  >
                    添加流水线阶段 (Add Stage)
                  </Button>
                </div>
              ),
            },
            {
              key: 'json',
              label: (
                <Space>
                  <CodeOutlined />
                  <span>DSL 源码编辑</span>
                </Space>
              ),
              children: (
                <Input.TextArea
                  rows={14}
                  value={stagesJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default DesignerModal;
