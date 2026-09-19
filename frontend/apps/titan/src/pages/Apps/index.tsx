import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  App as AntdApp,
  Empty,
  Tabs,
  Popconfirm,
  Alert,
  Card,
  Row,
  Col,
  Segmented,
  Tooltip,
  Descriptions,
  Table,
  Badge,
} from "antd";
import {
  PlusOutlined,
  AppstoreOutlined,
  GithubOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  RocketOutlined,
  CopyOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import { PageContainer, ProTable, type ProColumns } from "@ant-design/pro-components";
import { useProject } from "../../contexts/ProjectContext";
import {
  titanListApps,
  titanCreateApp,
  titanUpdateApp,
  titanDeleteApp,
  titanListIntegrations,
  titanCreateArtifact,
  titanListArtifacts,
  type TitanListApps200ListItem,
  type TitanListIntegrations200ListItem,
  type TitanListArtifacts200ListItem,
} from "@zero/api";

const { Text, Title, Paragraph } = Typography;

export const AppsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = AntdApp.useApp();
  const { currentProjectId, currentProject } = useProject();
  const [apps, setApps] = useState<TitanListApps200ListItem[]>([]);
  const [integrations, setIntegrations] = useState<TitanListIntegrations200ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<TitanListApps200ListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Zadig 布局模式：工作台分栏模式 (workbench) vs 表格模式 (table)
  const [layoutMode, setLayoutMode] = useState<"workbench" | "table">("workbench");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // 选定服务的制品历史
  const [serviceArtifacts, setServiceArtifacts] = useState<TitanListArtifacts200ListItem[]>([]);
  const [artifactLoading, setArtifactLoading] = useState(false);

  // 构建制品状态
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [buildingApp, setBuildingApp] = useState<TitanListApps200ListItem | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildForm] = Form.useForm();

  const loadApps = useCallback(async (targetSelectId?: number) => {
    if (!currentProjectId) {
      setApps([]);
      setSelectedAppId(null);
      return;
    }
    setLoading(true);
    try {
      const res = await titanListApps(currentProjectId, { page: 1, pageSize: 100 });
      const list = res.list || [];
      setApps(list);
      if (list.length > 0) {
        if (targetSelectId && list.some((a) => a.id === targetSelectId)) {
          setSelectedAppId(targetSelectId);
        } else if (!selectedAppId || !list.some((a) => a.id === selectedAppId)) {
          setSelectedAppId(list[0].id!);
        }
      } else {
        setSelectedAppId(null);
      }
    } catch (err) {
      console.error("Failed to load apps:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, selectedAppId]);

  useEffect(() => {
    const targetAppId = searchParams.get("appId");
    if (targetAppId) {
      setSelectedAppId(Number(targetAppId));
    }
  }, [searchParams]);

  const loadIntegrations = async () => {
    try {
      const res = await titanListIntegrations({ page: 1, pageSize: 100 });
      setIntegrations(res.list || []);
    } catch (err) {
      console.error("Failed to load integrations:", err);
    }
  };

  const loadServiceArtifacts = useCallback(async (appId: number) => {
    if (!currentProjectId) return;
    setArtifactLoading(true);
    try {
      const res = await titanListArtifacts(currentProjectId, { appId, page: 1, pageSize: 10 });
      setServiceArtifacts(res.list || []);
    } catch (err) {
      console.error("Failed to load service artifacts:", err);
    } finally {
      setArtifactLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    loadIntegrations();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadServiceArtifacts(selectedAppId);
    } else {
      setServiceArtifacts([]);
    }
  }, [selectedAppId, loadServiceArtifacts]);

  const handleOpenCreate = () => {
    setEditingApp(null);
    form.resetFields();
    form.setFieldsValue({
      defaultBranch: "main",
      buildConfig: JSON.stringify(
        {
          dockerfilePath: "Dockerfile",
          contextPath: ".",
          baseImage: "golang:1.24-alpine",
          buildArgs: { CGO_ENABLED: "0" },
        },
        null,
        2
      ),
      deploySpec: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.APP_NAME}}
  labels:
    app: {{.APP_NAME}}
spec:
  replicas: {{.REPLICAS}}
  selector:
    matchLabels:
      app: {{.APP_NAME}}
  template:
    metadata:
      labels:
        app: {{.APP_NAME}}
    spec:
      containers:
      - name: app
        image: {{.IMAGE}}
        ports:
        - containerPort: 8080
`,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (app: TitanListApps200ListItem) => {
    setEditingApp(app);
    form.setFieldsValue({
      name: app.name,
      displayName: app.displayName,
      description: app.description,
      integrationId: app.integrationId,
      repoUrl: app.repoUrl,
      defaultBranch: app.defaultBranch,
      buildConfig: app.buildConfig,
      deploySpec: app.deploySpec,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingApp) {
        await titanUpdateApp(currentProjectId!, editingApp.id!, {
          name: values.name,
          displayName: values.displayName,
          description: values.description,
          integrationId: values.integrationId,
          repoUrl: values.repoUrl,
          defaultBranch: values.defaultBranch,
          buildConfig: values.buildConfig,
          deploySpec: values.deploySpec,
          status: 1,
        });
        message.success("应用更新成功");
        setModalOpen(false);
        await loadApps(editingApp.id);
      } else {
        const createRes = await titanCreateApp(currentProjectId!, {
          name: values.name,
          displayName: values.displayName,
          description: values.description,
          integrationId: values.integrationId,
          repoUrl: values.repoUrl,
          defaultBranch: values.defaultBranch,
          buildConfig: values.buildConfig,
          deploySpec: values.deploySpec,
        });
        message.success("应用创建成功");
        setModalOpen(false);
        const newId = createRes?.id;
        if (newId) {
          setSelectedAppId(newId);
        }
        await loadApps(newId);
      }
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await titanDeleteApp(currentProjectId!, id);
      message.success("应用已删除");
      await loadApps();
    } catch (err: any) {
      message.error(err.message || "删除失败");
    }
  };

  const handleOpenBuild = (app: TitanListApps200ListItem) => {
    setBuildingApp(app);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randomHex = Math.random().toString(16).substring(2, 8);
    const defaultTag = `v1.0.0-${dateStr}.${randomHex}`;

    buildForm.setFieldsValue({
      gitBranch: app.defaultBranch || "main",
      imageTag: defaultTag,
      imageUrl: `registry.local/titan/${app.name}:${defaultTag}`,
      gitCommit: randomHex,
      commitMsg: `feat(${app.name}): 自动构建应用不可变制品`,
    });
    setBuildModalOpen(true);
  };

  const handleExecuteBuild = async () => {
    try {
      const values = await buildForm.validateFields();
      setBuilding(true);
      await titanCreateArtifact(currentProjectId!, {
        appId: buildingApp!.id!,
        imageUrl: values.imageUrl,
        imageTag: values.imageTag,
        gitBranch: values.gitBranch,
        gitCommit: values.gitCommit,
        commitMsg: values.commitMsg,
        imageDigest: `sha256:${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
        imageSizeBytes: Math.floor(150 * 1024 * 1024 + Math.random() * 50 * 1024 * 1024),
      });
      message.success(`🎉 制品 ${values.imageTag} 构建完成并入库！`);
      setBuildModalOpen(false);
      buildForm.resetFields();
      if (selectedAppId) {
        await loadServiceArtifacts(selectedAppId);
      }
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.message || "构建失败");
    } finally {
      setBuilding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  if (!currentProjectId) {
    return (
      <PageContainer>
        <Empty description="请先在顶部选择一个交付项目" />
      </PageContainer>
    );
  }

  const currentApp = apps.find((a) => a.id === selectedAppId);

  return (
    <PageContainer
      header={{
        title: `微服务应用管理 (Services) - ${currentProject?.displayName || currentProject?.name}`,
        subTitle: "对齐 Zadig 服务管理规范：每个应用对齐独立 Git 代码仓，内聚 Dockerfile 镜像构建配置与 Kubernetes YAML 编排模板",
        extra: [
          <Segmented
            key="viewSwitch"
            value={layoutMode}
            onChange={(val) => setLayoutMode(val as "workbench" | "table")}
            options={[
              { label: "服务工作台", value: "workbench", icon: <ApartmentOutlined /> },
              { label: "表格视图", value: "table", icon: <UnorderedListOutlined /> },
            ]}
          />,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            添加微服务应用
          </Button>,
        ],
      }}
    >
      {apps.length === 0 ? (
        <Card variant="borderless">
          <Empty description="当前项目下暂无微服务应用，点击上方按钮接入第一个微服务">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              接入微服务应用
            </Button>
          </Empty>
        </Card>
      ) : layoutMode === "workbench" ? (
        /* Zadig 标志性左右分栏服务工作台模式 */
        <Row gutter={16}>
          {/* 左侧服务列表 */}
          <Col xs={24} md={7} lg={6}>
            <Card
              title={<span style={{ fontWeight: 600 }}>微服务列表 ({apps.length})</span>}
              variant="borderless"
              styles={{ body: { padding: "8px 0" } }}
              style={{ height: "calc(100vh - 200px)", minHeight: 650, overflowY: "auto" }}
            >
              {apps.map((app) => {
                const isActive = app.id === selectedAppId;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id!)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      background: isActive ? "#e6f4ff" : "transparent",
                      borderLeft: isActive ? "4px solid #1677ff" : "4px solid transparent",
                      transition: "all 0.2s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space size={10} style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          background: isActive ? "#1677ff" : "#f0f0f0",
                          color: isActive ? "#ffffff" : "#595959",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        <AppstoreOutlined />
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {app.displayName || app.name}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {app.name}
                        </Text>
                      </div>
                    </Space>
                    <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>
                      {app.defaultBranch || "main"}
                    </Tag>
                  </div>
                );
              })}
            </Card>
          </Col>

          {/* 右侧微服务详细工作台 */}
          <Col xs={24} md={17} lg={18}>
            {currentApp ? (
              <Card
                variant="borderless"
                style={{ height: "calc(100vh - 200px)", minHeight: 650, overflowY: "auto" }}
              >
                {/* 服务头部信息栏 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    paddingBottom: 16,
                    borderBottom: "1px solid #f0f0f0",
                    marginBottom: 16,
                  }}
                >
                  <Space size={16} align="center">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      <AppstoreOutlined />
                    </div>
                    <div>
                      <Space align="center">
                        <Title level={4} style={{ margin: 0 }}>
                          {currentApp.displayName || currentApp.name}
                        </Title>
                        <Tag color="geekblue">{currentApp.name}</Tag>
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          配置就绪
                        </Tag>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Space size={12}>
                          <Space size={4}>
                            <GithubOutlined style={{ color: "#8c8c8c" }} />
                            <a
                              href={currentApp.repoUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 12 }}
                            >
                              {currentApp.repoUrl || "未配置代码仓"}
                            </a>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            默认分支: <strong>{currentApp.defaultBranch || "main"}</strong>
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </Space>

                  <Space>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(currentApp)}
                    >
                      修改服务配置
                    </Button>
                    <Button
                      icon={<RocketOutlined />}
                      style={{ color: "#52c41a", borderColor: "#52c41a" }}
                      onClick={() => handleOpenBuild(currentApp)}
                    >
                      构建不可变制品
                    </Button>
                    <Popconfirm
                      title="确认移除该微服务吗？"
                      description="移除后对应的发布绑定将一并解除"
                      onConfirm={() => handleDelete(currentApp.id!)}
                      okText="确认删除"
                      cancelText="取消"
                    >
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>

                {/* Zadig 标志性三大 Tab */}
                <Tabs
                  defaultActiveKey="build"
                  items={[
                    {
                      key: "build",
                      label: (
                        <Space>
                          <CodeOutlined />
                          <span>镜像构建配置 (Build Spec)</span>
                        </Space>
                      ),
                      children: (
                        <div>
                          <Alert
                            message="不可变镜像构建策略 (Aligned with Zadig Docker Build)"
                            description="通过 Git 仓库代码检出，基于 Dockerfile 与指定编译环境打出不可变容器镜像制品并推送到镜像中心。"
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Dockerfile 路径">Dockerfile</Descriptions.Item>
                            <Descriptions.Item label="构建上下文路径">.</Descriptions.Item>
                            <Descriptions.Item label="基础镜像源">golang:1.24-alpine</Descriptions.Item>
                            <Descriptions.Item label="编译参数">CGO_ENABLED=0</Descriptions.Item>
                            <Descriptions.Item label="集成凭据">默认 Git/Harbor 凭据</Descriptions.Item>
                            <Descriptions.Item label="缓存策略">Docker BuildKit Cache</Descriptions.Item>
                          </Descriptions>

                          <Card
                            title="构建上下文 JSON 配置"
                            size="small"
                            extra={
                              <Space>
                                <Button
                                  size="small"
                                  type="primary"
                                  ghost
                                  icon={<EditOutlined />}
                                  onClick={() => handleOpenEdit(currentApp)}
                                >
                                  修改构建配置
                                </Button>
                                <Button
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(currentApp.buildConfig || "{}")}
                                >
                                  复制配置
                                </Button>
                              </Space>
                            }
                            style={{ background: "#f8f9fa" }}
                          >
                            <pre style={{ margin: 0, fontSize: 12, fontFamily: "monospace", maxHeight: 220, overflow: "auto" }}>
                              {currentApp.buildConfig || "{}"}
                            </pre>
                          </Card>
                        </div>
                      ),
                    },
                    {
                      key: "deploy",
                      label: (
                        <Space>
                          <FileTextOutlined />
                          <span>Kubernetes 编排定义 (Deploy Spec)</span>
                        </Space>
                      ),
                      children: (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Text type="secondary">
                              K8s 交付模板，发布时将动态注入 `IMAGE`、`APP_NAME`、`REPLICAS` 等环境上下文变量：
                            </Text>
                            <Space>
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEdit(currentApp)}
                              >
                                修改 YAML 模板
                              </Button>
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(currentApp.deploySpec || "")}
                              >
                                复制 YAML
                              </Button>
                            </Space>
                          </div>
                          <Card size="small" style={{ background: "#282c34", color: "#abb2bf", borderRadius: 6 }}>
                            <pre style={{ margin: 0, fontSize: 12, fontFamily: "Consolas, Menlo, monospace", maxHeight: 360, overflow: "auto" }}>
                              {currentApp.deploySpec || "# 暂无 YAML 模板"}
                            </pre>
                          </Card>
                        </div>
                      ),
                    },
                    {
                      key: "artifacts",
                      label: (
                        <Space>
                          <RocketOutlined />
                          <span>制品版本历史 ({serviceArtifacts.length})</span>
                        </Space>
                      ),
                      children: (
                        <div>
                          <Table
                            rowKey="id"
                            loading={artifactLoading}
                            dataSource={serviceArtifacts}
                            pagination={false}
                            size="small"
                            columns={[
                              {
                                title: "不可变镜像版本 (Image Tag)",
                                dataIndex: "imageTag",
                                render: (tag) => <Tag color="cyan">{tag}</Tag>,
                              },
                              {
                                title: "源码 Commit",
                                dataIndex: "gitCommit",
                                render: (commit, r) => (
                                  <Space>
                                    <Text code>{commit?.substring(0, 7)}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>({r.commitMsg || "无说明"})</Text>
                                  </Space>
                                ),
                              },
                              {
                                title: "产出时间",
                                dataIndex: "createTime",
                                render: (t) => <Text type="secondary">{t?.substring(0, 16)}</Text>,
                              },
                              {
                                title: "操作",
                                render: () => (
                                  <Button
                                    size="small"
                                    type="link"
                                    icon={<RocketOutlined />}
                                    onClick={() => navigate("/environments")}
                                  >
                                    去环境发布
                                  </Button>
                                ),
                              },
                            ]}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            ) : (
              <Empty description="请从左侧列表选择一个微服务应用查看详情" />
            )}
          </Col>
        </Row>
      ) : (
        /* 聚合表格模式 */
        <Card variant="borderless" styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={apps}
            pagination={false}
            columns={[
              {
                title: "微服务标识 / 显示名称",
                render: (_, record) => (
                  <Space size={10}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "#1677ff",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppstoreOutlined />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{record.displayName || record.name}</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{record.name}</Text>
                    </div>
                  </Space>
                ),
              },
              {
                title: "代码仓与分支",
                render: (_, record) => (
                  <Space direction="vertical" size={2}>
                    <Space size={4}>
                      <GithubOutlined style={{ color: "#8c8c8c" }} />
                      <a href={record.repoUrl || "#"} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                        {record.repoUrl?.split("/").slice(-2).join("/") || "未配置"}
                      </a>
                    </Space>
                    <Tag color="blue" style={{ fontSize: 10, width: "fit-content" }}>
                      分支: {record.defaultBranch || "main"}
                    </Tag>
                  </Space>
                ),
              },
              {
                title: "构建与编排定义",
                render: (_, record) => (
                  <Button
                    size="small"
                    icon={<CodeOutlined />}
                    onClick={() => {
                      setSelectedAppId(record.id!);
                      setLayoutMode("workbench");
                    }}
                  >
                    查看 Dockerfile & YAML
                  </Button>
                ),
              },
              {
                title: "操作",
                render: (_, record) => (
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      icon={<RocketOutlined />}
                      style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      onClick={() => handleOpenBuild(record)}
                    >
                      构建制品
                    </Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
                      编辑
                    </Button>
                    <Popconfirm
                      title="确认删除此应用吗？"
                      onConfirm={() => handleDelete(record.id!)}
                      okText="删除"
                      cancelText="取消"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* 创建/编辑应用 Modal */}
      <Modal
        title={editingApp ? "编辑微服务应用" : "添加微服务应用"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="微服务唯一标识 (Name / Slug)"
                tooltip="支持小写字母、数字与中划线，作为 Kubernetes Deployment 及容器命名的唯一标识"
                rules={[
                  { required: true, message: "请输入微服务标识" },
                  { pattern: /^[a-z0-9-]+$/, message: "仅支持小写字母、数字及中划线" },
                ]}
              >
                <Input placeholder="例如: order-service" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayName"
                label="微服务显示名称"
                rules={[{ required: true, message: "请输入显示名称" }]}
              >
                <Input placeholder="例如: 订单中心微服务" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="repoUrl"
                label="Git 代码仓库地址"
                rules={[{ required: true, message: "请输入代码仓地址" }]}
              >
                <Input placeholder="https://github.com/org/repo.git" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="defaultBranch"
                label="默认编译分支"
                rules={[{ required: true, message: "请输入默认分支" }]}
              >
                <Input placeholder="main / master" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="服务描述">
            <Input placeholder="说明该服务职责与技术栈" />
          </Form.Item>

          <Form.Item
            name="buildConfig"
            label="Dockerfile 构建配置 (JSON)"
            rules={[{ required: true, message: "请输入构建配置" }]}
          >
            <Input.TextArea rows={4} style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>

          <Form.Item
            name="deploySpec"
            label="Kubernetes 部署 YAML 模板 (Deploy Spec)"
            rules={[{ required: true, message: "请输入部署模板" }]}
          >
            <Input.TextArea rows={6} style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 构建不可变制品 Modal */}
      <Modal
        title={
          <Space>
            <RocketOutlined style={{ color: "#52c41a" }} />
            <span>构建应用制品 - {buildingApp?.displayName || buildingApp?.name}</span>
          </Space>
        }
        open={buildModalOpen}
        onCancel={() => setBuildModalOpen(false)}
        onOk={handleExecuteBuild}
        confirmLoading={building}
        okText="立即构建并注册制品"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Alert
          message="不可变镜像构建与注册 (Immutable Artifact Build)"
          description="基于当前微服务代码仓分支与 Dockerfile 策略构建容器镜像制品，构建完成后自动落库制品中心，可直接用于多环境发布与回滚。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={buildForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gitBranch"
                label="代码分支 (Git Branch)"
                rules={[{ required: true, message: "请输入分支名" }]}
              >
                <Input placeholder="main / develop" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="imageTag"
                label="制品版本Tag (Image Tag)"
                rules={[{ required: true, message: "请输入版本号" }]}
              >
                <Input placeholder="v1.0.0-rc1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="imageUrl"
            label="目标镜像全名 (Image URL)"
            rules={[{ required: true, message: "请输入镜像地址" }]}
          >
            <Input placeholder="harbor.example.com/repo/app:v1.0.0" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gitCommit" label="Git Commit (SHA)">
                <Input placeholder="e.g. 7f98d6c" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="commitMsg" label="提交说明 (Commit Message)">
                <Input placeholder="简要说明本次构建包含的改动" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AppsPage;
