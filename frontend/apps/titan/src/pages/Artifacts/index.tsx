import React, { useState, useEffect, useCallback } from "react";
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
import {
  RocketOutlined,
  TagOutlined,
  GithubOutlined,
  CopyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { PageContainer, ProTable, type ProColumns } from "@ant-design/pro-components";
import { useProject } from "../../contexts/ProjectContext";
import {
  titanListArtifacts,
  titanListApps,
  titanListEnvs,
  titanDeployArtifact,
  type TitanListArtifacts200ListItem,
  type TitanListApps200ListItem,
  type TitanListEnvs200ListItem,
} from "@zero/api";

const { Text } = Typography;

export const ArtifactsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
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

  const loadArtifacts = useCallback(async () => {
    if (!currentProjectId) {
      setArtifacts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await titanListArtifacts(currentProjectId, {
        appId: selectedAppId,
        page: 1,
        pageSize: 100,
      });
      setArtifacts(res.list || []);
    } catch (err) {
      console.error("Failed to load artifacts:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, selectedAppId]);

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
      message.warning("请选择目标发布环境");
      return;
    }
    setDeploying(true);
    try {
      await titanDeployArtifact(targetEnvId, {
        appId: deployingArtifact.appId!,
        artifactId: deployingArtifact.id!,
      });
      const targetEnv = envs.find((e) => e.id === targetEnvId);
      message.success(`制品 ${deployingArtifact.imageTag} 已成功发布至 ${targetEnv?.name || "目标环境"}！`);
      setDeployModalOpen(false);
    } catch (err: any) {
      message.error(err.message || "发布失败");
    } finally {
      setDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  const columns: ProColumns<TitanListArtifacts200ListItem>[] = [
    {
      title: "所属微服务",
      dataIndex: "appName",
      render: (_, record) => <Text strong>{record.appName}</Text>,
    },
    {
      title: "不可变镜像版本 (Tag)",
      dataIndex: "imageTag",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Tag color="cyan" icon={<TagOutlined />}>
              {record.imageTag}
            </Tag>
            <Tooltip title="复制完整镜像地址">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(`${record.imageUrl}:${record.imageTag}`)}
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
      title: "源码追溯 (Git Commit)",
      dataIndex: "gitCommit",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <GithubOutlined />
            <Text code style={{ fontSize: 12 }}>{record.gitCommit?.substring(0, 8)}</Text>
            <Tag color="blue">{record.gitBranch || "main"}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.commitMsg || "无提交描述"}
          </Text>
        </Space>
      ),
    },
    {
      title: "镜像大小",
      dataIndex: "imageSizeBytes",
      render: (bytes: any) => {
        const mb = Number(bytes) / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
      },
    },
    {
      title: "制品状态",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "AVAILABLE" ? "success" : "default"}>
          {status === "AVAILABLE" ? "可用" : "已过期"}
        </Tag>
      ),
    },
    {
      title: "构建生成时间",
      dataIndex: "createTime",
      valueType: "dateTime",
    },
    {
      title: "发布分发",
      valueType: "option",
      render: (_, record) => [
        <Button
          key="deploy"
          type="primary"
          size="small"
          icon={<RocketOutlined />}
          onClick={() => handleOpenDeploy(record)}
        >
          发布到环境
        </Button>,
      ],
    },
  ];

  if (!currentProjectId) {
    return (
      <PageContainer>
        <Empty description="请先在顶部或项目列表中选择一个项目" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: `不可变制品中心 - ${currentProject?.displayName || currentProject?.name}`,
        subTitle: "遵从不可变基础设施原则：代码仓构建仅生成一次镜像制品版本，随各环境晋级发布并支持精准版本回溯",
        extra: [
          <Select
            key="appFilter"
            placeholder="按应用筛选"
            allowClear
            value={selectedAppId}
            onChange={setSelectedAppId}
            style={{ width: 180 }}
          >
            {apps.map((a) => (
              <Select.Option key={a.id} value={a.id}>
                {a.displayName || a.name}
              </Select.Option>
            ))}
          </Select>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={loadArtifacts}>
            刷新
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
        title={`发布制品到环境: ${deployingArtifact?.imageTag}`}
        open={deployModalOpen}
        onCancel={() => setDeployModalOpen(false)}
        onOk={handleExecuteDeploy}
        confirmLoading={deploying}
        destroyOnClose
      >
        <Form layout="vertical">
          <div style={{ background: "#f8f9fa", padding: 12, borderRadius: 6, marginBottom: 16 }}>
            <div><strong>所属微服务:</strong> {deployingArtifact?.appName}</div>
            <div><strong>完整镜像:</strong> {deployingArtifact?.imageUrl}:{deployingArtifact?.imageTag}</div>
            <div><strong>源码 Commit:</strong> {deployingArtifact?.gitCommit?.substring(0, 8)} ({deployingArtifact?.commitMsg})</div>
          </div>

          <Form.Item label="选择发布目标环境" required>
            <Select
              value={targetEnvId}
              onChange={setTargetEnvId}
              placeholder="选择目标环境"
              style={{ width: "100%" }}
            >
              {envs.map((e) => (
                <Select.Option key={e.id} value={e.id}>
                  {e.name} ({e.envCode?.toUpperCase()} - {e.clusterName} / {e.namespace})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ArtifactsPage;
