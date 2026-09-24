import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { copyToClipboard } from "@zero/shared";
import { dns1123Validator } from "../../constants/validation";
import { getErrorMessage, isFormValidateError } from "../../utils/error";
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
import { useIntl } from "../../contexts/LocaleContext";
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
  const { formatMessage: t } = useIntl();
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

  // 竞态保护：请求序列号，仅最新请求可写入状态
  const envSeqRef = useRef(0);
  const activeEnvIdRef = useRef<number | null>(null);
  activeEnvIdRef.current = activeEnvId;

  // 1. 加载当前项目的所有交付环境
  const loadEnvs = useCallback(async () => {
    if (!currentProjectId) {
      setEnvs([]);
      setActiveEnvId(null);
      return;
    }
    const seq = ++envSeqRef.current;
    setLoading(true);
    try {
      const res = await titanListEnvs(currentProjectId);
      if (seq !== envSeqRef.current) return; // 过期响应丢弃
      const list = res.list || [];
      setEnvs(list);
      if (list.length > 0) {
        if (!activeEnvIdRef.current || !list.some((e) => e.id === activeEnvIdRef.current)) {
          setActiveEnvId(list[0].id!);
        }
      } else {
        setActiveEnvId(null);
      }
    } catch (err) {
      if (seq !== envSeqRef.current) return;
      message.error(t({ id: "titan.envs.loadEnvsFailed", defaultMessage: "加载环境列表失败，请稍后重试" }));
    } finally {
      if (seq === envSeqRef.current) {
        setLoading(false);
      }
    }
  }, [currentProjectId, message, t]);

  // 2. 加载选定环境的实时微服务大盘数据
  const liveSeqRef = useRef(0);
  const loadLiveDetail = useCallback(async (envId: number) => {
    const seq = ++liveSeqRef.current;
    setLiveLoading(true);
    try {
      const res = await titanGetEnvLiveDetail(envId);
      if (seq !== liveSeqRef.current) return; // 过期响应丢弃
      setLiveApps(res.apps || []);
    } catch (err) {
      if (seq !== liveSeqRef.current) return;
      message.error(t({ id: "titan.envs.loadLiveFailed", defaultMessage: "加载环境大盘失败，请稍后重试" }));
    } finally {
      if (seq === liveSeqRef.current) {
        setLiveLoading(false);
      }
    }
  }, [message, t]);

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
      message.success(t({ id: "titan.envs.createSuccess", defaultMessage: "环境创建成功" }));
      setCreateModalOpen(false);
      createForm.resetFields();
      await loadEnvs();
    } catch (err) {
      if (isFormValidateError(err)) return;
      message.error(getErrorMessage(err, t({ id: "titan.common.createFailed", defaultMessage: "创建失败" })));
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
      message.warning(t({ id: "titan.envs.deployWarning", defaultMessage: "请选择要发布的制品版本" }));
      return;
    }
    setDeploying(true);
    try {
      await titanDeployArtifact(currentProjectId!, activeEnvId, {
        appId: deployingApp.appId!,
        artifactId: selectedArtifactId,
      });
      message.success(
        t(
          { id: "titan.envs.deploySuccess", defaultMessage: "应用 {name} 已发布至当前环境！" },
          { name: deployingApp.displayName || deployingApp.appName }
        )
      );
      setDeployModalOpen(false);
      await loadLiveDetail(activeEnvId);
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: "titan.common.deployFailed", defaultMessage: "发布失败" })));
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
      message.warning(t({ id: "titan.envs.batchSelectEnvWarning", defaultMessage: "请选择目标交付环境" }));
      return;
    }
    if (selectedAppIds.length === 0) {
      message.warning(t({ id: "titan.envs.batchSelectAppWarning", defaultMessage: "请至少勾选一个要发布的微服务应用" }));
      return;
    }

    setBatchDeploying(true);
    try {
      // Promise.allSettled：单个失败不中断其余发布，结果部分成功汇总展示
      const deployable = selectedAppIds
        .map(Number)
        .filter((appId) => selectedArtifactMap[appId]);
      const results = await Promise.allSettled(
        deployable.map((appId) =>
          titanDeployArtifact(currentProjectId!, batchTargetEnvId, {
            appId,
            artifactId: selectedArtifactMap[appId],
          }),
        ),
      );
      const failures = results.filter((r) => r.status === "rejected");
      const successCount = results.length - failures.length;
      const targetEnvObj = envs.find((e) => e.id === batchTargetEnvId);
      if (failures.length === 0) {
        message.success(
          t(
            { id: "titan.envs.batchSuccess", defaultMessage: "🎉 批量交付工作流执行成功！已发布 {count} 个微服务应用至 [{env}]！" },
            { count: successCount, env: targetEnvObj?.name || t({ id: "titan.envs.targetEnvFallback", defaultMessage: "目标环境" }) }
          ),
        );
        setBatchModalOpen(false);
      } else {
        message.warning(
          t(
            { id: "titan.envs.batchPartial", defaultMessage: "批量发布完成：{success} 个成功，{failed} 个失败（单应用失败不影响其余应用）" },
            { success: successCount, failed: failures.length }
          ),
        );
        if (successCount === 0) {
          setBatchModalOpen(false);
        }
      }
      if (activeEnvId === batchTargetEnvId) {
        await loadLiveDetail(batchTargetEnvId);
      } else {
        setActiveEnvId(batchTargetEnvId);
      }
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: "titan.envs.batchFailed", defaultMessage: "批量发布中断，请检查集群与制品配置" })));
    } finally {
      setBatchDeploying(false);
    }
  };

  // 复制到剪贴板（统一走 @zero/shared，含降级与失败提示）
  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      message.success(t({ id: "titan.common.copySuccess", defaultMessage: "已复制到剪贴板" }));
    } else {
      message.error(t({ id: "titan.common.copyFailed", defaultMessage: "复制失败，请手动复制" }));
    }
  };

  if (!currentProjectId) {
    return (
      <PageContainer>
        <Empty description={t({ id: "titan.common.selectProjectFirst", defaultMessage: "请先在顶部或项目列表中选择一个项目" })} />
      </PageContainer>
    );
  }

  const currentEnv = envs.find((e) => e.id === activeEnvId);

  return (
    <PageContainer
      header={{
        title: t(
          { id: "titan.envs.title", defaultMessage: "环境大盘 (Environments) - {project}" },
          { project: currentProject?.displayName || currentProject?.name }
        ),
        subTitle: t({
          id: "titan.envs.subTitle",
          defaultMessage:
            "对齐 Zadig 核心交付体验：按环境组织微服务群组，一屏掌控所有服务的 Pod 实时就绪度与部署制品版本",
        }),
        extra: [
          <Button
            key="batchDeploy"
            type="primary"
            icon={<RocketOutlined />}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
            onClick={handleOpenBatchDeploy}
          >
            {t({ id: "titan.envs.batchDeploy", defaultMessage: "批量交付发布工作流" })}
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => activeEnvId && loadLiveDetail(activeEnvId)}>
            {t({ id: "titan.envs.refreshLive", defaultMessage: "刷新运行态" })}
          </Button>,
          <Button key="create" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            {t({ id: "titan.envs.createEnv", defaultMessage: "拉起新环境" })}
          </Button>,
        ],
      }}
    >
      {envs.length === 0 ? (
        <Card variant="borderless">
          <Empty
            description={t({
              id: "titan.envs.emptyNoEnvs",
              defaultMessage: "该项目暂未配置交付环境，点击上方按钮创建你的第一套环境（如 dev、staging、prod）",
            })}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              {t({ id: "titan.envs.emptyNoEnvsAction", defaultMessage: "创建开发环境" })}
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
                    <Descriptions.Item label={t({ id: "titan.envs.descCluster", defaultMessage: "宿主 Kubernetes 集群" })}>
                      <Space>
                        <ClusterOutlined style={{ color: "#722ed1" }} />
                        <Text strong>
                          {currentEnv.clusterName ||
                            t({ id: "titan.envs.clusterFallback", defaultMessage: "集群 #{id}" }, { id: currentEnv.clusterId })}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={t({ id: "titan.envs.descNamespace", defaultMessage: "目标命名空间" })}>
                      <Tag color="purple">{currentEnv.namespace}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t({ id: "titan.envs.descServiceCount", defaultMessage: "微服务总数" })}>
                      <Badge count={liveApps.length} showZero color="#1677ff" />
                    </Descriptions.Item>
                    <Descriptions.Item label={t({ id: "titan.envs.descDeployMode", defaultMessage: "部署模式" })}>
                      <Tag color="blue">K8s YAML SSA</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t({ id: "titan.envs.descRunState", defaultMessage: "环境运行态" })}>
                      <Badge status="success" text={t({ id: "titan.envs.runStateOk", defaultMessage: "正常服务中" })} />
                    </Descriptions.Item>
                  </Descriptions>
                </Col>

                {/* Zadig 标志性 Pod 健康就绪度仪表 */}
                <Col xs={24} md={8}>
                  <div style={{ background: "#fafafa", padding: "10px 14px", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t({ id: "titan.envs.podReadiness", defaultMessage: "Pod 副本整体就绪度:" })}
                      </Text>
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
              placeholder={t({ id: "titan.envs.searchPlaceholder", defaultMessage: "按微服务名称、标识或镜像 Tag 过滤..." })}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              style={{ width: 320 }}
            />

            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "card" | "table")}
              options={[
                { label: t({ id: "titan.envs.viewCard", defaultMessage: "微服务网格" }), value: "card", icon: <AppstoreAddOutlined /> },
                { label: t({ id: "titan.envs.viewTable", defaultMessage: "紧凑列表" }), value: "table", icon: <UnorderedListOutlined /> },
              ]}
            />
          </div>

          {/* 空状态引导 */}
          {!liveLoading && filteredLiveApps.length === 0 ? (
            <Card style={{ marginTop: 8 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space orientation="vertical" size={4}>
                    <Text>{t({ id: "titan.envs.emptyNoApps", defaultMessage: "该环境尚未有微服务应用运行态" })}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t({
                        id: "titan.envs.emptyNoAppsHint",
                        defaultMessage: "请前往「微服务应用」页面完成应用接入，并构建第一个制品后发布到此环境",
                      })}
                    </Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  icon={<AppstoreOutlined />}
                  onClick={() => navigate("/apps")}
                >
                  {t({ id: "titan.envs.emptyNoAppsAction", defaultMessage: "前往管理微服务应用" })}
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
                          {isRunning
                            ? t({ id: "titan.envs.tagRunning", defaultMessage: "运行就绪" })
                            : isUpdating
                              ? t({ id: "titan.envs.tagUpdating", defaultMessage: "升级中" })
                              : t({ id: "titan.envs.tagNotDeployed", defaultMessage: "未部署" })}
                        </Tag>
                      </div>

                      <div style={{ background: "#f8f9fa", padding: "10px 12px", borderRadius: 6, marginBottom: 12, flex: 1 }}>
                        <div style={{ marginBottom: 6 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t({ id: "titan.envs.currentArtifact", defaultMessage: "当前运行制品 Tag:" })}
                          </Text>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            {app.imageTag ? (
                              <>
                                <Tag color="cyan" icon={<TagOutlined />}>
                                  {app.imageTag}
                                </Tag>
                                <Tooltip title={t({ id: "titan.envs.copyTagTooltip", defaultMessage: "复制制品 Tag" })}>
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy(app.imageTag || "")}
                                  />
                                </Tooltip>
                              </>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {t({ id: "titan.envs.noArtifact", defaultMessage: "尚未部署任何制品" })}
                              </Text>
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
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t({ id: "titan.envs.podReadinessShort", defaultMessage: "Pod 副本就绪度:" })}{" "}
                          </Text>
                          <Text strong style={{ color: isRunning ? "#52c41a" : undefined }}>
                            {app.readyReplicas} / {app.totalReplicas} Pods
                          </Text>
                        </div>
                      </div>

                      {/* Pod 实例列表 */}
                      {app.pods && app.pods.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {t({ id: "titan.envs.podsList", defaultMessage: "容器实例 Pods ({count}):" }, { count: app.pods.length })}
                          </Text>
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
                          {app.lastDeployedTime
                            ? t(
                                { id: "titan.envs.deployedAt", defaultMessage: "部署于 {time}" },
                                { time: app.lastDeployedTime.substring(5, 16) }
                              )
                            : t({ id: "titan.envs.noDeployRecord", defaultMessage: "暂无部署记录" })}
                        </Text>
                        <Space>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/apps?appId=${app.appId}`)}
                          >
                            {t({ id: "titan.envs.editConfig", defaultMessage: "修改配置" })}
                          </Button>
                          <Popconfirm
                            title={t({ id: "titan.envs.restartConfirmTitle", defaultMessage: "确认重启此服务吗？" })}
                            description={t({ id: "titan.envs.restartConfirmDesc", defaultMessage: "K8s 将触发该微服务 Deployment 的滚动重启。" })}
                            onConfirm={() =>
                              message.success(
                                t(
                                  { id: "titan.envs.restartMsg", defaultMessage: "已触发 {name} 滚动重启指令" },
                                  { name: app.displayName || app.appName }
                                )
                              )
                            }
                            okText={t({ id: "titan.envs.okRestart", defaultMessage: "重启" })}
                            cancelText={t({ id: "titan.common.cancel", defaultMessage: "取消" })}
                          >
                            <Button size="small">{t({ id: "titan.envs.okRestart", defaultMessage: "重启" })}</Button>
                          </Popconfirm>
                          <Button
                            type="primary"
                            size="small"
                            icon={<RocketOutlined />}
                            onClick={() => handleOpenDeploy(app)}
                          >
                            {t({ id: "titan.envs.deployUpgrade", defaultMessage: "发布/升级" })}
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
                    title: t({ id: "titan.envs.colName", defaultMessage: "微服务名称" }),
                    render: (_, record) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{record.displayName || record.appName}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.appName}</Text>
                      </div>
                    ),
                  },
                  {
                    title: t({ id: "titan.envs.colArtifact", defaultMessage: "当前运行制品 (Tag)" }),
                    dataIndex: "imageTag",
                    render: (tag) =>
                      tag ? (
                        <Tag color="cyan" icon={<TagOutlined />}>
                          {tag}
                        </Tag>
                      ) : (
                        <Text type="secondary">{t({ id: "titan.envs.tagNotDeployed", defaultMessage: "未部署" })}</Text>
                      ),
                  },
                  {
                    title: t({ id: "titan.apps.colCommit", defaultMessage: "源码 Commit" }),
                    dataIndex: "gitCommit",
                    render: (c) => (c ? <Text code>{c.substring(0, 7)}</Text> : "-"),
                  },
                  {
                    title: t({ id: "titan.envs.colPodReadiness", defaultMessage: "Pod 副本就绪度" }),
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
                    title: t({ id: "titan.envs.colDeployTime", defaultMessage: "部署时间" }),
                    dataIndex: "lastDeployedTime",
                    render: (time) => (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {time || t({ id: "titan.envs.noRecord", defaultMessage: "暂无" })}
                      </Text>
                    ),
                  },
                  {
                    title: t({ id: "titan.common.action", defaultMessage: "操作" }),
                    render: (_, record) => (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/apps?appId=${record.appId}`)}
                        >
                          {t({ id: "titan.envs.editConfig", defaultMessage: "修改配置" })}
                        </Button>
                        <Popconfirm
                          title={t({ id: "titan.envs.restartConfirmTitle", defaultMessage: "确认重启此服务吗？" })}
                          onConfirm={() =>
                            message.success(
                              t(
                                { id: "titan.envs.restartMsgShort", defaultMessage: "已触发 {name} 滚动重启" },
                                { name: record.displayName || record.appName }
                              )
                            )
                          }
                          okText={t({ id: "titan.envs.okRestart", defaultMessage: "重启" })}
                          cancelText={t({ id: "titan.common.cancel", defaultMessage: "取消" })}
                        >
                          <Button size="small">{t({ id: "titan.envs.okRestart", defaultMessage: "重启" })}</Button>
                        </Popconfirm>
                        <Button
                          type="primary"
                          size="small"
                          icon={<RocketOutlined />}
                          onClick={() => handleOpenDeploy(record)}
                        >
                          {t({ id: "titan.envs.deployUpgrade", defaultMessage: "发布/升级" })}
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
        title={t({ id: "titan.envs.createModalTitle", defaultMessage: "拉起新交付环境" })}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateEnv}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label={t({ id: "titan.envs.labelName", defaultMessage: "环境显示名称" })}
            rules={[{ required: true, message: t({ id: "titan.envs.ruleName", defaultMessage: "请输入环境名称" }) }]}
          >
            <Input placeholder={t({ id: "titan.envs.placeholderName", defaultMessage: "例如: 联调开发环境 / 灰度验证环境" })} />
          </Form.Item>
          <Form.Item
            name="envCode"
            label={t({ id: "titan.envs.labelEnvCode", defaultMessage: "环境类型代码" })}
            rules={[{ required: true, message: t({ id: "titan.envs.ruleEnvCode", defaultMessage: "请选择环境标识" }) }]}
          >
            <Select
              placeholder={t({ id: "titan.envs.placeholderEnvCode", defaultMessage: "选择环境代码" })}
              options={[
                { value: "dev", label: t({ id: "titan.envs.optDev", defaultMessage: "dev - 开发联调环境" }) },
                { value: "test", label: t({ id: "titan.envs.optTest", defaultMessage: "test - 自动化测试环境" }) },
                { value: "staging", label: t({ id: "titan.envs.optStaging", defaultMessage: "staging - 预发布环境" }) },
                { value: "prod", label: t({ id: "titan.envs.optProd", defaultMessage: "prod - 生产核心环境" }) },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="clusterId"
            label={t({ id: "titan.envs.labelCluster", defaultMessage: "部署目标 Kubernetes 集群" })}
            rules={[{ required: true, message: t({ id: "titan.envs.ruleCluster", defaultMessage: "请选择物理/逻辑集群" }) }]}
          >
            <Select
              placeholder={t({ id: "titan.envs.placeholderCluster", defaultMessage: "选择集群" })}
              options={clusters.map((c) => ({
                key: c.id,
                value: c.id,
                label: `${c.name} (${c.env} - ${c.status})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="namespace"
            label={t({ id: "titan.envs.labelNamespace", defaultMessage: "目标 Namespace" })}
            rules={[
              { validator: dns1123Validator },
              { required: true, message: t({ id: "titan.envs.ruleNamespace", defaultMessage: "请输入 Kubernetes 命名空间" }) },
            ]}
          >
            <Input placeholder={t({ id: "titan.envs.placeholderNamespace", defaultMessage: "例如: mall-dev / mall-staging" })} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 部署/升级制品弹窗 */}
      <Modal
        title={t(
          { id: "titan.envs.deployModalTitle", defaultMessage: "发布制品到当前环境: {name}" },
          { name: deployingApp?.displayName || deployingApp?.appName }
        )}
        open={deployModalOpen}
        onCancel={() => setDeployModalOpen(false)}
        onOk={handleExecuteDeploy}
        confirmLoading={deploying}
        width={600}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            {t({
              id: "titan.envs.deployModalHint",
              defaultMessage: "从已构建完成的不可变容器镜像制品库中选择目标版本发布至当前环境：",
            })}
          </Text>
        </div>

        <Form layout="vertical">
          <Form.Item label={t({ id: "titan.envs.labelArtifact", defaultMessage: "选择不可变镜像制品 (Image Tag)" })} required>
            <Select
              value={selectedArtifactId}
              onChange={setSelectedArtifactId}
              placeholder={t({ id: "titan.envs.placeholderArtifact", defaultMessage: "请选择制品镜像" })}
              style={{ width: "100%" }}
              options={artifacts.map((art) => ({
                key: art.id,
                value: art.id,
                label: (
                  <Space>
                    <Tag color="cyan">{art.imageTag}</Tag>
                    <span>Commit: {art.gitCommit?.substring(0, 7)}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({art.commitMsg || t({ id: "titan.envs.noCommitMsg", defaultMessage: "无提交信息" })})
                    </Text>
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          {selectedArtifactId && (
            <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, fontSize: 12 }}>
              {(() => {
                const cur = artifacts.find((a) => a.id === selectedArtifactId);
                if (!cur) return null;
                return (
                  <>
                    <div>
                      <strong>{t({ id: "titan.envs.fullImage", defaultMessage: "完整镜像:" })}</strong> {cur.imageUrl}:{cur.imageTag}
                    </div>
                    <div>
                      <strong>{t({ id: "titan.envs.digest", defaultMessage: "SHA256 摘要:" })}</strong>{" "}
                      {cur.imageDigest || t({ id: "titan.envs.digestEmpty", defaultMessage: "未生成" })}
                    </div>
                    <div>
                      <strong>{t({ id: "titan.envs.buildTime", defaultMessage: "构建产出时间:" })}</strong> {cur.createTime}
                    </div>
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
            <span>{t({ id: "titan.envs.batchModalTitle", defaultMessage: "执行多服务批量交付发布工作流 (Batch Delivery Workflow)" })}</span>
          </Space>
        }
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={handleExecuteBatchDeploy}
        confirmLoading={batchDeploying}
        okText={t({ id: "titan.envs.batchOkText", defaultMessage: "一键批量发布 ({count} 个应用)" }, { count: selectedAppIds.length })}
        cancelText={t({ id: "titan.common.cancel", defaultMessage: "取消" })}
        width={860}
        destroyOnHidden
      >
        <Alert
          title={t({
            id: "titan.envs.batchAlertTitle",
            defaultMessage: "基于不可变制品的多应用批量发布工作流 (Aligned with Zadig Delivery Workflow)",
          })}
          description={t({
            id: "titan.envs.batchAlertDesc",
            defaultMessage:
              "支持在单一交付工作流中勾选项目下的多个微服务应用，指定各自要发布的不可变制品版本（Tag），系统将通过 K8s YAML SSA 动态编排并发发布至目标交付环境。",
          })}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <Text strong>{t({ id: "titan.envs.targetEnv", defaultMessage: "目标交付环境：" })}</Text>
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
              title: t({ id: "titan.envs.batchColApp", defaultMessage: "微服务应用" }),
              dataIndex: "name",
              render: (_, record) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{record.displayName || record.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.name}</Text>
                </div>
              ),
            },
            {
              title: t({ id: "titan.envs.batchColCurrent", defaultMessage: "当前运行制品" }),
              render: (_, record) => {
                const liveItem = liveApps.find((a) => a.appId === record.id);
                return liveItem && liveItem.imageTag ? (
                  <Tag color="blue">{liveItem.imageTag}</Tag>
                ) : (
                  <Text type="secondary">{t({ id: "titan.envs.tagNotDeployed", defaultMessage: "未部署" })}</Text>
                );
              },
            },
            {
              title: t({ id: "titan.envs.batchColArtifact", defaultMessage: "选择目标发布制品版本 (Artifact)" }),
              render: (_, record) => {
                const arts = appArtifactMap[record.id!] || [];
                if (arts.length === 0) {
                  return <Text type="warning">{t({ id: "titan.envs.noArtifactHint", defaultMessage: "暂无制品 (请先在应用页构建)" })}</Text>;
                }
                return (
                  <Select
                    value={selectedArtifactMap[record.id!]}
                    onChange={(val) =>
                      setSelectedArtifactMap((prev) => ({ ...prev, [record.id!]: val }))
                    }
                    style={{ width: "100%" }}
                    options={arts.map((art) => ({
                      label: `${art.imageTag} (${art.gitCommit?.slice(0, 7) || "latest"}) - ${
                        art.commitMsg || t({ id: "titan.envs.noCommitDesc", defaultMessage: "无提交说明" })
                      }`,
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
