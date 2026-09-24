import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Select,
  App as AntdApp,
  Empty,
  Tooltip,
} from "antd";
import { copyToClipboard } from "@zero/shared";
import {
  RocketOutlined,
  TagOutlined,
  GithubOutlined,
  CopyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { PageContainer, ProTable, type ProColumns } from "@ant-design/pro-components";
import { useProject } from "../../contexts/ProjectContext";
import { useIntl } from "../../contexts/LocaleContext";
import {
  titanListArtifacts,
  titanListApps,
  titanListEnvs,
  titanDeployArtifact,
  type TitanListArtifacts200ListItem,
  type TitanListApps200ListItem,
  type TitanListEnvs200ListItem,
} from "@zero/api";
import { getErrorMessage } from "../../utils/error";

const { Text } = Typography;

export const ArtifactsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage: t } = useIntl();
  const { currentProjectId, currentProject } = useProject();
  const [artifacts, setArtifacts] = useState<TitanListArtifacts200ListItem[]>([]);
  const [apps, setApps] = useState<TitanListApps200ListItem[]>([]);
  const [envs, setEnvs] = useState<TitanListEnvs200ListItem[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // 部署弹窗状态
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployingArtifact, setDeployingArtifact] = useState<TitanListArtifacts200ListItem | null>(null);
  const [targetEnvId, setTargetEnvId] = useState<number | null>(null);
  const [deploying, setDeploying] = useState(false);

  // 竞态保护：请求序列号，仅最新请求可写入状态
  const artSeqRef = useRef(0);

  const loadArtifacts = useCallback(async () => {
    if (!currentProjectId) {
      setArtifacts([]);
      return;
    }
    const seq = ++artSeqRef.current;
    setLoading(true);
    try {
      const res = await titanListArtifacts(currentProjectId, {
        appId: selectedAppId,
        page: 1,
        pageSize: 100,
      });
      if (seq !== artSeqRef.current) return; // 过期响应丢弃
      setArtifacts(res.list || []);
    } catch (err) {
      if (seq !== artSeqRef.current) return;
      message.error(t({ id: "titan.artifacts.loadFailed", defaultMessage: "加载制品列表失败，请稍后重试" }));
    } finally {
      if (seq === artSeqRef.current) {
        setLoading(false);
      }
    }
  }, [currentProjectId, selectedAppId, message, t]);

  const loadMetadata = useCallback(async () => {
    if (!currentProjectId) return;
    try {
      const [appRes, envRes] = await Promise.all([
        titanListApps(currentProjectId, { page: 1, pageSize: 100 }),
        titanListEnvs(currentProjectId),
      ]);
      setApps(appRes.list || []);
      setEnvs(envRes.list || []);
    } catch (err) {
      console.error("Failed to load apps/envs metadata:", err);
    }
  }, [currentProjectId]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleOpenDeploy = (artifact: TitanListArtifacts200ListItem) => {
    setDeployingArtifact(artifact);
    setTargetEnvId(envs.length > 0 ? envs[0].id! : null);
    setDeployModalOpen(true);
  };

  const handleExecuteDeploy = async () => {
    if (!targetEnvId || !deployingArtifact) {
      message.warning(t({ id: "titan.artifacts.selectEnvWarning", defaultMessage: "请选择目标发布环境" }));
      return;
    }
    setDeploying(true);
    try {
      await titanDeployArtifact(currentProjectId!, targetEnvId, {
        appId: deployingArtifact.appId!,
        artifactId: deployingArtifact.id!,
      });
      const targetEnv = envs.find((e) => e.id === targetEnvId);
      message.success(
        t(
          { id: "titan.artifacts.deploySuccess", defaultMessage: "制品 {tag} 已成功发布至 {env}！" },
          { tag: deployingArtifact.imageTag, env: targetEnv?.name || t({ id: "titan.envs.targetEnvFallback", defaultMessage: "目标环境" }) }
        )
      );
      setDeployModalOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: "titan.common.deployFailed", defaultMessage: "发布失败" })));
    } finally {
      setDeploying(false);
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

  const columns: ProColumns<TitanListArtifacts200ListItem>[] = [
    {
      title: t({ id: "titan.artifacts.colApp", defaultMessage: "所属微服务" }),
      dataIndex: "appName",
      render: (_, record) => <Text strong>{record.appName}</Text>,
    },
    {
      title: t({ id: "titan.artifacts.colImageTag", defaultMessage: "不可变镜像版本 (Tag)" }),
      dataIndex: "imageTag",
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Tag color="cyan" icon={<TagOutlined />}>
              {record.imageTag}
            </Tag>
            <Tooltip title={t({ id: "titan.artifacts.copyImageTooltip", defaultMessage: "复制完整镜像地址" })}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(`${record.imageUrl}:${record.imageTag}`)}
              />
            </Tooltip>
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.imageUrl}
          </Text>
        </Space>
      ),
    },
    {
      title: t({ id: "titan.artifacts.colCommit", defaultMessage: "源码追溯 (Git Commit)" }),
      dataIndex: "gitCommit",
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <GithubOutlined />
            <Text code style={{ fontSize: 12 }}>{record.gitCommit?.substring(0, 8)}</Text>
            <Tag color="blue">{record.gitBranch || "main"}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.commitMsg || t({ id: "titan.artifacts.noCommitMsg", defaultMessage: "无提交描述" })}
          </Text>
        </Space>
      ),
    },
    {
      title: t({ id: "titan.artifacts.colImageSize", defaultMessage: "镜像大小" }),
      dataIndex: "imageSizeBytes",
      render: (bytes: any) => {
        const mb = Number(bytes) / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
      },
    },
    {
      title: t({ id: "titan.artifacts.colStatus", defaultMessage: "制品状态" }),
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "AVAILABLE" ? "success" : "default"}>
          {status === "AVAILABLE"
            ? t({ id: "titan.artifacts.statusAvailable", defaultMessage: "可用" })
            : t({ id: "titan.artifacts.statusExpired", defaultMessage: "已过期" })}
        </Tag>
      ),
    },
    {
      title: t({ id: "titan.artifacts.colBuildTime", defaultMessage: "构建生成时间" }),
      dataIndex: "createTime",
      valueType: "dateTime",
    },
    {
      title: t({ id: "titan.artifacts.colDeploy", defaultMessage: "发布分发" }),
      valueType: "option",
      render: (_, record) => [
        <Button
          key="deploy"
          type="primary"
          size="small"
          icon={<RocketOutlined />}
          onClick={() => handleOpenDeploy(record)}
        >
          {t({ id: "titan.artifacts.deployToEnv", defaultMessage: "发布到环境" })}
        </Button>,
      ],
    },
  ];

  if (!currentProjectId) {
    return (
      <PageContainer>
        <Empty description={t({ id: "titan.common.selectProjectFirst", defaultMessage: "请先在顶部或项目列表中选择一个项目" })} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: t(
          { id: "titan.artifacts.title", defaultMessage: "不可变制品中心 - {project}" },
          { project: currentProject?.displayName || currentProject?.name }
        ),
        subTitle: t({
          id: "titan.artifacts.subTitle",
          defaultMessage:
            "遵从不可变基础设施原则：代码仓构建仅生成一次镜像制品版本，随各环境晋级发布并支持精准版本回溯",
        }),
        extra: [
          <Select
            key="appFilter"
            placeholder={t({ id: "titan.artifacts.filterPlaceholder", defaultMessage: "按应用筛选" })}
            allowClear
            value={selectedAppId}
            onChange={setSelectedAppId}
            style={{ width: 180 }}
            options={apps.map((a) => ({
              key: a.id,
              value: a.id,
              label: a.displayName || a.name,
            }))}
          />,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={loadArtifacts}>
            {t({ id: "titan.common.refresh", defaultMessage: "刷新" })}
          </Button>,
        ],
      }}
    >
      <ProTable<TitanListArtifacts200ListItem>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={artifacts}
        search={false}
        pagination={{ pageSize: 20 }}
      />

      {/* 发布制品到环境弹窗 */}
      <Modal
        title={t(
          { id: "titan.artifacts.deployModalTitle", defaultMessage: "发布制品到环境: {tag}" },
          { tag: deployingArtifact?.imageTag }
        )}
        open={deployModalOpen}
        onCancel={() => setDeployModalOpen(false)}
        onOk={handleExecuteDeploy}
        confirmLoading={deploying}
        destroyOnHidden
      >
        <Form layout="vertical">
          <div style={{ background: "#f8f9fa", padding: 12, borderRadius: 6, marginBottom: 16 }}>
            <div>
              <strong>{t({ id: "titan.artifacts.infoApp", defaultMessage: "所属微服务:" })}</strong> {deployingArtifact?.appName}
            </div>
            <div>
              <strong>{t({ id: "titan.artifacts.infoImage", defaultMessage: "完整镜像:" })}</strong>{" "}
              {deployingArtifact?.imageUrl}:{deployingArtifact?.imageTag}
            </div>
            <div>
              <strong>{t({ id: "titan.artifacts.infoCommit", defaultMessage: "源码 Commit:" })}</strong>{" "}
              {deployingArtifact?.gitCommit?.substring(0, 8)} ({deployingArtifact?.commitMsg})
            </div>
          </div>

          <Form.Item label={t({ id: "titan.artifacts.labelEnv", defaultMessage: "选择发布目标环境" })} required>
            <Select
              value={targetEnvId}
              onChange={setTargetEnvId}
              placeholder={t({ id: "titan.artifacts.placeholderEnv", defaultMessage: "选择目标环境" })}
              style={{ width: "100%" }}
              options={envs.map((e) => ({
                key: e.id,
                value: e.id,
                label: `${e.name} (${e.envCode?.toUpperCase()} - ${e.clusterName} / ${e.namespace})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ArtifactsPage;
