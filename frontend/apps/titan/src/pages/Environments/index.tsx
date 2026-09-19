import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  App as AntdApp,
  Tabs,
  Badge,
  Descriptions,
  Tooltip,
  Empty,
  Popconfirm,
  Alert,
  Table,
  Segmented,
  Progress,
} from "antd";
import {
  PlusOutlined,
  CloudServerOutlined,
  RocketOutlined,
  ReloadOutlined,
  ClusterOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined,
  TagOutlined,
  AppstoreOutlined,
  AppstoreAddOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  CopyOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../contexts/ProjectContext";
import {
  titanListEnvs,
  titanCreateEnv,
  titanGetEnvLiveDetail,
  titanListArtifacts,
  titanDeployArtifact,
  titanListClusters,
  titanListApps,
  type TitanListEnvs200ListItem,
  type TitanGetEnvLiveDetail200AppsItem,
  type TitanListArtifacts200ListItem,
  type TitanListClusters200ListItem,
  type TitanListApps200ListItem,
} from "@zero/api";

const { Text, Title } = Typography;

export const EnvironmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { currentProjectId, currentProject } = useProject();
  const [envs, setEnvs] = useState<TitanListEnvs200ListItem[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<number | null>(null);
  const [liveApps, setLiveApps] = useState<TitanGetEnvLiveDetail200AppsItem[]>([]);
  const [clusters, setClusters] = useState<TitanListClusters200ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);

  // 视图与搜索状态
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 创建环境弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();

  // 部署/升级制品弹窗
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployingApp, setDeployingApp] = useState<TitanGetEnvLiveDetail200AppsItem | null>(null);
  const [artifacts, setArtifacts] = useState<TitanListArtifacts200ListItem[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<number | null>(null);
  const [deploying, setDeploying] = useState(false);

  // 批量交付发布工作流弹窗状态
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchTargetEnvId, setBatchTargetEnvId] = useState<number | null>(null);
  const [projectApps, setProjectApps] = useState<TitanListApps200ListItem[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<React.Key[]>([]);
  const [appArtifactMap, setAppArtifactMap] = useState<Record<number, TitanListArtifacts200ListItem[]>>({});
  const [selectedArtifactMap, setSelectedArtifactMap] = useState<Record<number, number>>({});
  const [batchDeploying, setBatchDeploying] = useState(false);

  // 1. 加载当前项目的所有交付环境
  const loadEnvs = useCallback(async () => {
    if (!currentProjectId) {
      setEnvs([]);
      setActiveEnvId(null);
      return;
    }
    setLoading(true);
    try {
      const res = await titanListEnvs(currentProjectId);
      const list = res.list || [];
      setEnvs(list);
      if (list.length > 0) {
        if (!activeEnvId || !list.some((e) => e.id === activeEnvId)) {
          setActiveEnvId(list[0].id!);
        }
      } else {
        setActiveEnvId(null);
      }
    } catch (err) {
      console.error("Failed to load environments:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, activeEnvId]);

  // 2. 加载选定环境的实时微服务大盘数据
  const loadLiveDetail = useCallback(async (envId: number) => {
    setLiveLoading(true);
    try {
      const res = await titanGetEnvLiveDetail(envId);
      setLiveApps(res.apps || []);
    } catch (err) {
      console.error("Failed to load live env detail:", err);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const loadClusters = async () => {
    try {
      const res = await titanListClusters({ page: 1, pageSize: 100 });
      setClusters(res.list || []);
    } catch (err) {
      console.error("Failed to load clusters:", err);
    }
  };

  useEffect(() => {
    loadEnvs();
    loadClusters();
  }, [loadEnvs]);

  useEffect(() => {
    if (activeEnvId) {
      loadLiveDetail(activeEnvId);
    } else {
      setLiveApps([]);
    }
  }, [activeEnvId, loadLiveDetail]);

  // 过滤后的微服务运行态列表
  const filteredLiveApps = useMemo(() => {
    if (!searchKeyword) return liveApps;
    const kw = searchKeyword.toLowerCase();
    return liveApps.filter(
      (a) =>
        a.appName?.toLowerCase().includes(kw) ||
        a.displayName?.toLowerCase().includes(kw) ||
        a.imageTag?.toLowerCase().includes(kw)
    );
  }, [liveApps, searchKeyword]);

  // 计算环境 Pod 健康度统计
  const envHealthStats = useMemo(() => {
    const totalReplicas = liveApps.reduce((sum, a) => sum + (a.totalReplicas || 0), 0);
    const readyReplicas = liveApps.reduce((sum, a) => sum + (a.readyReplicas || 0), 0);
    const percent = totalReplicas > 0 ? Math.round((readyReplicas / totalReplicas) * 100) : 100;
    return {
      totalReplicas,
      readyReplicas,
      percent,
    };
  }, [liveApps]);

  // 创建环境
  const handleCreateEnv = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      await titanCreateEnv(currentProjectId!, {
        envCode: values.envCode,
        name: values.name,
        clusterId: values.clusterId,
        namespace: values.namespace,
      });
      message.success("环境创建成功");
      setCreateModalOpen(false);
      createForm.resetFields();
      await loadEnvs();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.message || "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开部署制品弹窗
  const handleOpenDeploy = async (app: TitanGetEnvLiveDetail200AppsItem) => {
    setDeployingApp(app);
    setSelectedArtifactId(app.currentArtifactId || null);
    setDeployModalOpen(true);
    try {
      const res = await titanListArtifacts(currentProjectId!, { appId: app.appId, page: 1, pageSize: 50 });
      setArtifacts(res.list || []);
    } catch (err) {
      console.error("Failed to load artifacts:", err);
    }
  };

  // 执行制品发布到环境
  const handleExecuteDeploy = async () => {
    if (!activeEnvId || !deployingApp || !selectedArtifactId) {
      message.warning("请选择要发布的制品版本");
      return;
    }
    setDeploying(true);
    try {
      await titanDeployArtifact(activeEnvId, {
        appId: deployingApp.appId!,
        artifactId: selectedArtifactId,
      });
      message.success(`应用 ${deployingApp.displayName || deployingApp.appName} 已发布至当前环境！`);
      setDeployModalOpen(false);
      await loadLiveDetail(activeEnvId);
    } catch (err: any) {
      message.error(err.message || "发布失败");
    } finally {
      setDeploying(false);
    }
  };

  // 打开批量交付发布工作流
  const handleOpenBatchDeploy = async () => {
    if (!currentProjectId) return;
    setBatchTargetEnvId(activeEnvId);
    setBatchModalOpen(true);
    setBatchLoading(true);
    try {
      const appsRes = await titanListApps(currentProjectId, { page: 1, pageSize: 100 });
      const appsList = appsRes.list || [];
      setProjectApps(appsList);
      setSelectedAppIds(appsList.map((a) => a.id!));

      const artMap: Record<number, TitanListArtifacts200ListItem[]> = {};
      const selMap: Record<number, number> = {};

      await Promise.all(
        appsList.map(async (app) => {
          try {
            const artRes = await titanListArtifacts(currentProjectId, { appId: app.id, page: 1, pageSize: 20 });
            const list = artRes.list || [];
            artMap[app.id!] = list;
            if (list.length > 0) {
              selMap[app.id!] = list[0].id!;
            }
          } catch (e) {
            console.error(`Failed to load artifacts for app ${app.id}:`, e);
          }
        })
      );

      setAppArtifactMap(artMap);
      setSelectedArtifactMap(selMap);
    } catch (err) {
      console.error("Failed to prepare batch deploy:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  // 执行批量交付发布
  const handleExecuteBatchDeploy = async () => {
    if (!batchTargetEnvId) {
      message.warning("请选择目标交付环境");
      return;
    }
    if (selectedAppIds.length === 0) {
      message.warning("请至少勾选一个要发布的微服务应用");
      return;
    }

    setBatchDeploying(true);
    let successCount = 0;
    try {
      for (const appId of selectedAppIds) {
        const artifactId = selectedArtifactMap[Number(appId)];
        if (artifactId) {
          await titanDeployArtifact(batchTargetEnvId, {
            appId: Number(appId),
            artifactId,
          });
          successCount++;
        }
      }
      const targetEnvObj = envs.find((e) => e.id === batchTargetEnvId);
      message.success(
        `🎉 批量交付工作流执行成功！已发布 ${successCount} 个微服务应用至 [${targetEnvObj?.name || "目标环境"}]！`
      );
      setBatchModalOpen(false);
      if (activeEnvId === batchTargetEnvId) {
        await loadLiveDetail(batchTargetEnvId);
      } else {
        setActiveEnvId(batchTargetEnvId);
      }
    } catch (err: any) {
      message.error(err.message || "批量发布中断，请检查集群与制品配置");
    } finally {
      setBatchDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  if (!currentProjectId) {
    return (
      <PageContainer>
        <Empty description="请先在顶部或项目列表中选择一个项目" />
      </PageContainer>
    );
  }

  const currentEnv = envs.find((e) => e.id === activeEnvId);

  return (
    <PageContainer
      header={{
        title: `环境大盘 (Environments) - ${currentProject?.displayName || currentProject?.name}`,
        subTitle: "对齐 Zadig 核心交付体验：按环境组织微服务群组，一屏掌控所有服务的 Pod 实时就绪度与部署制品版本",
        extra: [
          <Button
            key="batchDeploy"
            type="primary"
            icon={<RocketOutlined />}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
            onClick={handleOpenBatchDeploy}
          >
            批量交付发布工作流
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => activeEnvId && loadLiveDetail(activeEnvId)}>
            刷新运行态
          </Button>,
          <Button key="create" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            拉起新环境
          </Button>,
        ],
      }}
    >
      {envs.length === 0 ? (
        <Card variant="borderless">
          <Empty
            description="该项目暂未配置交付环境，点击上方按钮创建你的第一套环境（如 dev、staging、prod）"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              创建开发环境
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          {/* Zadig 标志性环境状态选项卡 */}
          <Tabs
            type="card"
            activeKey={String(activeEnvId)}
            onChange={(key) => setActiveEnvId(Number(key))}
            items={envs.map((env) => {
              const isProd = env.envCode === "prod";
              const isStaging = env.envCode === "staging";
              return {
                key: String(env.id),
                label: (
                  <Space size={8}>
                    <CloudServerOutlined />
                    <span style={{ fontWeight: 600 }}>{env.name}</span>
                    <Tag
                      color={isProd ? "red" : isStaging ? "orange" : "blue"}
                      style={{ margin: 0, fontSize: 11 }}
                    >
                      {env.envCode?.toUpperCase()}
                    </Tag>
                  </Space>
                ),
              };
            })}
          />

          {/* 环境状态与健康指标概览横幅 - Zadig 专属设计 */}
          {currentEnv && (
            <Card
              size="small"
              variant="borderless"
              style={{
                marginBottom: 16,
                background: "#ffffff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} md={16}>
                  <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="宿主 Kubernetes 集群">
                      <Space>
                        <ClusterOutlined style={{ color: "#722ed1" }} />
                        <Text strong>{currentEnv.clusterName || `集群 #${currentEnv.clusterId}`}</Text>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="目标命名空间">
                      <Tag color="purple">{currentEnv.namespace}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="微服务总数">
                      <Badge count={liveApps.length} showZero color="#1677ff" />
                    </Descriptions.Item>
                    <Descriptions.Item label="部署模式">
                      <Tag color="blue">K8s YAML SSA</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="环境运行态">
                      <Badge status="success" text="正常服务中" />
                    </Descriptions.Item>
                  </Descriptions>
                </Col>

                {/* Zadig 标志性 Pod 健康就绪度仪表 */}
                <Col xs={24} md={8}>
                  <div style={{ background: "#fafafa", padding: "10px 14px", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Pod 副本整体就绪度:</Text>
                      <Text strong style={{ color: "#52c41a", fontSize: 13 }}>
                        {envHealthStats.readyReplicas} / {envHealthStats.totalReplicas} Pods ({envHealthStats.percent}%)
                      </Text>
                    </div>
                    <Progress
                      percent={envHealthStats.percent}
                      status={envHealthStats.percent === 100 ? "success" : "active"}
                      strokeColor="#52c41a"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* 搜索与卡片/表格视图切换工具栏 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="按微服务名称、标识或镜像 Tag 过滤..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              style={{ width: 320 }}
            />

            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "card" | "table")}
              options={[
                { label: "微服务网格", value: "card", icon: <AppstoreAddOutlined /> },
                { label: "紧凑列表", value: "table", icon: <UnorderedListOutlined /> },
              ]}
            />
          </div>

          {/* 空状态引导 */}
          {!liveLoading && filteredLiveApps.length === 0 ? (
            <Card style={{ marginTop: 8 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={4}>
                    <Text>该环境尚未有微服务应用运行态</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      请前往「微服务应用」页面完成应用接入，并构建第一个制品后发布到此环境
                    </Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  icon={<AppstoreOutlined />}
                  onClick={() => navigate("/apps")}
                >
                  前往管理微服务应用
                </Button>
              </Empty>
            </Card>
          ) : viewMode === "card" ? (
            /* 视图模式 1：Zadig 风格微服务 Pod 运行态卡片网格 */
            <Row gutter={[16, 16]}>
              {filteredLiveApps.map((app) => {
                const isRunning = app.status === "RUNNING";
                const isUpdating = app.status === "UPDATING";
                return (
                  <Col xs={24} sm={12} lg={8} key={app.appId}>
                    <Card
                      hoverable
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 8,
                        borderLeft: isRunning ? "4px solid #52c41a" : isUpdating ? "4px solid #1677ff" : "4px solid #d9d9d9",
                        transition: "all 0.2s",
                      }}
                      styles={{
                        body: {
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                          padding: 16,
                        },
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <Title level={5} style={{ margin: 0 }}>
                            {app.displayName || app.appName}
                          </Title>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {app.appName}
                          </Text>
                        </div>
                        <Tag
                          icon={isRunning ? <CheckCircleOutlined /> : isUpdating ? <SyncOutlined spin /> : <StopOutlined />}
                          color={isRunning ? "success" : isUpdating ? "processing" : "default"}
                        >
                          {isRunning ? "运行就绪" : isUpdating ? "升级中" : "未部署"}
                        </Tag>
                      </div>

                      <div style={{ background: "#f8f9fa", padding: "10px 12px", borderRadius: 6, marginBottom: 12, flex: 1 }}>
                        <div style={{ marginBottom: 6 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>当前运行制品 Tag:</Text>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            {app.imageTag ? (
                              <>
                                <Tag color="cyan" icon={<TagOutlined />}>
                                  {app.imageTag}
                                </Tag>
                                <Tooltip title="复制制品 Tag">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => copyToClipboard(app.imageTag || "")}
                                  />
                                </Tooltip>
                              </>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>尚未部署任何制品</Text>
                            )}
                          </div>
                        </div>

                        {app.gitCommit && (
                          <div style={{ marginBottom: 6 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Git Commit: </Text>
                            <Text code style={{ fontSize: 12 }}>{app.gitCommit.substring(0, 8)}</Text>
                          </div>
                        )}

                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>Pod 副本就绪度: </Text>
                          <Text strong style={{ color: isRunning ? "#52c41a" : undefined }}>
                            {app.readyReplicas} / {app.totalReplicas} Pods
                          </Text>
                        </div>
                      </div>

                      {/* Pod 实例列表 */}
                      {app.pods && app.pods.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>容器实例 Pods ({app.pods.length}):</Text>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                            {app.pods.map((p) => (
                              <Tag key={p} color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                                <Badge status="success" style={{ marginRight: 4 }} />
                                {p}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {app.lastDeployedTime ? `部署于 ${app.lastDeployedTime.substring(5, 16)}` : "暂无部署记录"}
                        </Text>
                        <Space>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/apps?appId=${app.appId}`)}
                          >
                            修改配置
                          </Button>
                          <Popconfirm
                            title="确认重启此服务吗？"
                            description="K8s 将触发该微服务 Deployment 的滚动重启。"
                            onConfirm={() => message.success(`已触发 ${app.displayName || app.appName} 滚动重启指令`)}
                            okText="重启"
                            cancelText="取消"
                          >
                            <Button size="small">重启</Button>
                          </Popconfirm>
                          <Button
                            type="primary"
                            size="small"
                            icon={<RocketOutlined />}
                            onClick={() => handleOpenDeploy(app)}
                          >
                            发布/升级
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            /* 视图模式 2：Zadig 紧凑表格视图 */
            <Card variant="borderless" styles={{ body: { padding: 0 } }}>
              <Table
                rowKey="appId"
                dataSource={filteredLiveApps}
                pagination={false}
                columns={[
                  {
                    title: "微服务名称",
                    render: (_, record) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{record.displayName || record.appName}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.appName}</Text>
                      </div>
                    ),
                  },
                  {
                    title: "当前运行制品 (Tag)",
                    dataIndex: "imageTag",
                    render: (tag) =>
                      tag ? (
                        <Tag color="cyan" icon={<TagOutlined />}>
                          {tag}
                        </Tag>
                      ) : (
                        <Text type="secondary">未部署</Text>
                      ),
                  },
                  {
                    title: "源码 Commit",
                    dataIndex: "gitCommit",
                    render: (c) => (c ? <Text code>{c.substring(0, 7)}</Text> : "-"),
                  },
                  {
                    title: "Pod 副本就绪度",
                    render: (_, r) => (
                      <Space>
                        <Badge status={r.status === "RUNNING" ? "success" : "processing"} />
                        <Text strong style={{ color: r.status === "RUNNING" ? "#52c41a" : undefined }}>
                          {r.readyReplicas} / {r.totalReplicas} Pods
                        </Text>
                      </Space>
                    ),
                  },
                  {
                    title: "部署时间",
                    dataIndex: "lastDeployedTime",
                    render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t || "暂无"}</Text>,
                  },
                  {
                    title: "操作",
                    render: (_, record) => (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/apps?appId=${record.appId}`)}
                        >
                          修改配置
                        </Button>
                        <Popconfirm
                          title="确认重启此服务吗？"
                          onConfirm={() => message.success(`已触发 ${record.displayName || record.appName} 滚动重启`)}
                          okText="重启"
                          cancelText="取消"
                        >
                          <Button size="small">重启</Button>
                        </Popconfirm>
                        <Button
                          type="primary"
                          size="small"
                          icon={<RocketOutlined />}
                          onClick={() => handleOpenDeploy(record)}
                        >
                          发布/升级
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}

      {/* 创建交付环境弹窗 */}
      <Modal
        title="拉起新交付环境"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateEnv}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="环境显示名称"
            rules={[{ required: true, message: "请输入环境名称" }]}
          >
            <Input placeholder="例如: 联调开发环境 / 灰度验证环境" />
          </Form.Item>
          <Form.Item
            name="envCode"
            label="环境类型代码"
            rules={[{ required: true, message: "请选择环境标识" }]}
          >
            <Select placeholder="选择环境代码">
              <Select.Option value="dev">dev - 开发联调环境</Select.Option>
              <Select.Option value="test">test - 自动化测试环境</Select.Option>
              <Select.Option value="staging">staging - 预发布环境</Select.Option>
              <Select.Option value="prod">prod - 生产核心环境</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="clusterId"
            label="部署目标 Kubernetes 集群"
            rules={[{ required: true, message: "请选择物理/逻辑集群" }]}
          >
            <Select placeholder="选择集群">
              {clusters.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name} ({c.env} - {c.status})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="namespace"
            label="目标 Namespace"
            rules={[{ required: true, message: "请输入 Kubernetes 命名空间" }]}
          >
            <Input placeholder="例如: mall-dev / mall-staging" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 部署/升级制品弹窗 */}
      <Modal
        title={`发布制品到当前环境: ${deployingApp?.displayName || deployingApp?.appName}`}
        open={deployModalOpen}
        onCancel={() => setDeployModalOpen(false)}
        onOk={handleExecuteDeploy}
        confirmLoading={deploying}
        width={600}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            从已构建完成的不可变容器镜像制品库中选择目标版本发布至当前环境：
          </Text>
        </div>

        <Form layout="vertical">
          <Form.Item label="选择不可变镜像制品 (Image Tag)" required>
            <Select
              value={selectedArtifactId}
              onChange={setSelectedArtifactId}
              placeholder="请选择制品镜像"
              style={{ width: "100%" }}
            >
              {artifacts.map((art) => (
                <Select.Option key={art.id} value={art.id}>
                  <Space>
                    <Tag color="cyan">{art.imageTag}</Tag>
                    <span>Commit: {art.gitCommit?.substring(0, 7)}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({art.commitMsg || "无提交信息"})
                    </Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedArtifactId && (
            <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, fontSize: 12 }}>
              {(() => {
                const cur = artifacts.find((a) => a.id === selectedArtifactId);
                if (!cur) return null;
                return (
                  <>
                    <div><strong>完整镜像:</strong> {cur.imageUrl}:{cur.imageTag}</div>
                    <div><strong>SHA256 摘要:</strong> {cur.imageDigest || "未生成"}</div>
                    <div><strong>构建产出时间:</strong> {cur.createTime}</div>
                  </>
                );
              })()}
            </div>
          )}
        </Form>
      </Modal>

      {/* 多微服务应用批量交付发布工作流 Modal */}
      <Modal
        title={
          <Space>
            <RocketOutlined style={{ color: "#52c41a" }} />
            <span>执行多服务批量交付发布工作流 (Batch Delivery Workflow)</span>
          </Space>
        }
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={handleExecuteBatchDeploy}
        confirmLoading={batchDeploying}
        okText={`一键批量发布 (${selectedAppIds.length} 个应用)`}
        cancelText="取消"
        width={860}
        destroyOnClose
      >
        <Alert
          message="基于不可变制品的多应用批量发布工作流 (Aligned with Zadig Delivery Workflow)"
          description="支持在单一交付工作流中勾选项目下的多个微服务应用，指定各自要发布的不可变制品版本（Tag），系统将通过 K8s YAML SSA 动态编排并发发布至目标交付环境。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <Text strong>目标交付环境：</Text>
          <Select
            value={batchTargetEnvId || undefined}
            onChange={(val) => setBatchTargetEnvId(val)}
            style={{ width: 300 }}
            options={envs.map((env) => ({
              label: `${env.name} (${env.envCode?.toUpperCase()}) - ${env.namespace}`,
              value: env.id,
            }))}
          />
        </div>

        <Table
          rowKey="id"
          loading={batchLoading}
          pagination={false}
          size="small"
          rowSelection={{
            selectedRowKeys: selectedAppIds,
            onChange: (keys) => setSelectedAppIds(keys),
          }}
          dataSource={projectApps}
          columns={[
            {
              title: "微服务应用",
              dataIndex: "name",
              render: (_, record) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{record.displayName || record.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.name}</Text>
                </div>
              ),
            },
            {
              title: "当前运行制品",
              render: (_, record) => {
                const liveItem = liveApps.find((a) => a.appId === record.id);
                return liveItem && liveItem.imageTag ? (
                  <Tag color="blue">{liveItem.imageTag}</Tag>
                ) : (
                  <Text type="secondary">未部署 / 初始态</Text>
                );
              },
            },
            {
              title: "选择目标发布制品版本 (Artifact)",
              render: (_, record) => {
                const arts = appArtifactMap[record.id!] || [];
                if (arts.length === 0) {
                  return <Text type="warning">暂无制品 (请先在应用页构建)</Text>;
                }
                return (
                  <Select
                    value={selectedArtifactMap[record.id!]}
                    onChange={(val) =>
                      setSelectedArtifactMap((prev) => ({ ...prev, [record.id!]: val }))
                    }
                    style={{ width: "100%" }}
                    options={arts.map((art) => ({
                      label: `${art.imageTag} (${art.gitCommit?.slice(0, 7) || "latest"}) - ${art.commitMsg || "无提交说明"}`,
                      value: art.id,
                    }))}
                  />
                );
              },
            },
          ]}
        />
      </Modal>
    </PageContainer>
  );
};

export default EnvironmentsPage;
