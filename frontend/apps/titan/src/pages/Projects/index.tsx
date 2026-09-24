import React, { useState, useMemo } from "react";
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
  App as AntdApp,
  Statistic,
  Segmented,
  Table,
  Badge,
} from "antd";
import {
  PlusOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  AppstoreAddOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../contexts/ProjectContext";
import { useIntl } from "../../contexts/LocaleContext";
import { titanCreateProject, type TitanListProjects200ListItem } from "@zero/api";
import { getErrorMessage, isFormValidateError } from "../../utils/error";

const { Title, Text, Paragraph } = Typography;

export const ProjectsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { formatMessage: t } = useIntl();
  const { projects, currentProjectId, setCurrentProjectId, refreshProjects, loading } = useProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [form] = Form.useForm();

  // 过滤后的项目列表
  const filteredProjects = useMemo(() => {
    if (!searchKeyword) return projects;
    const kw = searchKeyword.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(kw) ||
        p.displayName?.toLowerCase().includes(kw) ||
        p.description?.toLowerCase().includes(kw)
    );
  }, [projects, searchKeyword]);

  // 项目统计概览
  const stats = useMemo(() => {
    const totalApps = projects.reduce((acc, cur) => acc + (cur.appCount || 0), 0);
    const totalEnvs = projects.reduce((acc, cur) => acc + (cur.envCount || 0), 0);
    const activeProject = projects.find((p) => p.id === currentProjectId);
    return {
      projectCount: projects.length,
      totalApps,
      totalEnvs,
      activeProjectName:
        activeProject?.displayName ||
        activeProject?.name ||
        t({ id: "titan.projects.noneSelected", defaultMessage: "未选择" }),
    };
  }, [projects, currentProjectId, t]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await titanCreateProject(values);
      message.success(t({ id: "titan.projects.createSuccess", defaultMessage: "项目创建成功" }));
      setModalOpen(false);
      form.resetFields();
      await refreshProjects();
    } catch (err) {
      if (isFormValidateError(err)) return;
      message.error(getErrorMessage(err, t({ id: "titan.common.createFailed", defaultMessage: "创建失败" })));
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "P";
    const parts = name.split(/[-_ ]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <PageContainer
      header={{
        title: t({ id: "titan.projects.title", defaultMessage: "交付项目空间 (Projects)" }),
        subTitle: t({
          id: "titan.projects.subTitle",
          defaultMessage:
            "对齐 Zadig 云原生项目模型：以交付项目为核心组织微服务群组、代码仓、多环境资源与发布工作流",
        }),
        extra: [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            {t({ id: "titan.projects.create", defaultMessage: "新建项目" })}
          </Button>,
        ],
      }}
    >
      {/* 顶部统计卡片横幅 - Zadig 风格 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: "#ffffff", borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: "#8c8c8c" }}>{t({ id: "titan.projects.statTotalProjects", defaultMessage: "交付项目总数" })}</span>}
              value={stats.projectCount}
              prefix={<ProjectOutlined style={{ color: "#1677ff", marginRight: 8 }} />}
              suffix={<span style={{ fontSize: 13, color: "#8c8c8c" }}>{t({ id: "titan.projects.statUnitProjects", defaultMessage: "个" })}</span>}
              styles={{content: { fontWeight: 600 }}}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: "#ffffff", borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: "#8c8c8c" }}>{t({ id: "titan.projects.statActiveProject", defaultMessage: "当前生效项目" })}</span>}
              value={stats.activeProjectName}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />}
              styles={{content: { fontWeight: 600, fontSize: 18 }}}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: "#ffffff", borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: "#8c8c8c" }}>{t({ id: "titan.projects.statTotalApps", defaultMessage: "纳管微服务应用" })}</span>}
              value={stats.totalApps}
              prefix={<AppstoreOutlined style={{ color: "#722ed1", marginRight: 8 }} />}
              suffix={<span style={{ fontSize: 13, color: "#8c8c8c" }}>{t({ id: "titan.projects.statUnitApps", defaultMessage: "个服务" })}</span>}
              styles={{content: { fontWeight: 600 }}}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: "#ffffff", borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: "#8c8c8c" }}>{t({ id: "titan.projects.statTotalEnvs", defaultMessage: "活跃交付环境" })}</span>}
              value={stats.totalEnvs}
              prefix={<CloudServerOutlined style={{ color: "#fa8c16", marginRight: 8 }} />}
              suffix={<span style={{ fontSize: 13, color: "#8c8c8c" }}>{t({ id: "titan.projects.statUnitEnvs", defaultMessage: "套环境" })}</span>}
              styles={{content: { fontWeight: 600 }}}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索与视图切换工具栏 */}
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
          placeholder={t({ id: "titan.projects.searchPlaceholder", defaultMessage: "按项目唯一标识、名称或描述过滤搜索..." })}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
          style={{ width: 340 }}
        />

        <Space>
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as "card" | "table")}
            options={[
              { label: t({ id: "titan.projects.viewCard", defaultMessage: "卡片大盘" }), value: "card", icon: <AppstoreAddOutlined /> },
              { label: t({ id: "titan.projects.viewTable", defaultMessage: "紧凑列表" }), value: "table", icon: <UnorderedListOutlined /> },
            ]}
          />
        </Space>
      </div>

      {/* 视图模式 1：Zadig 风格卡片网格 */}
      {viewMode === "card" ? (
        <Row gutter={[20, 20]}>
          {filteredProjects.map((proj) => {
            const isSelected = proj.id === currentProjectId;
            return (
              <Col xs={24} sm={12} lg={8} key={proj.id}>
                <Card
                  hoverable
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 8,
                    border: isSelected ? "2px solid #1677ff" : "1px solid #f0f0f0",
                    transition: "all 0.2s ease-in-out",
                  }}
                  styles={{
                    body: {
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      padding: 20,
                    },
                  }}
                >
                  {/* 项目头部 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <Space align="center" size={12}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: isSelected
                            ? "linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)"
                            : "linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 700,
                          boxShadow: isSelected ? "0 4px 10px rgba(22, 119, 255, 0.3)" : undefined,
                        }}
                      >
                        {getInitials(proj.name)}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Title level={5} style={{ margin: 0 }}>
                            {proj.displayName || proj.name}
                          </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {proj.name}
                        </Text>
                      </div>
                    </Space>

                    <Space orientation="vertical" align="end" size={2}>
                      {isSelected ? (
                        <Tag color="processing" icon={<CheckCircleOutlined />}>
                          {t({ id: "titan.projects.tagActive", defaultMessage: "当前生效" })}
                        </Tag>
                      ) : (
                        <Tag color="default">{t({ id: "titan.projects.tagReady", defaultMessage: "就绪" })}</Tag>
                      )}
                      <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                        K8s YAML
                      </Tag>
                    </Space>
                  </div>

                  {/* 描述信息 */}
                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ flex: 1, minHeight: 40, marginBottom: 16, fontSize: 13 }}
                  >
                    {proj.description || t({ id: "titan.projects.noDescription", defaultMessage: "暂无项目描述" })}
                  </Paragraph>

                  {/* 环境拓扑小圆点提示 - Zadig 标志性指标 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      padding: "6px 10px",
                      background: "#fafafa",
                      borderRadius: 6,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t({ id: "titan.projects.envHealthLabel", defaultMessage: "环境链路健康度:" })}
                    </Text>
                    <Space size={6}>
                      <Badge status="success" text={<span style={{ fontSize: 11 }}>DEV</span>} />
                      <Badge status="processing" text={<span style={{ fontSize: 11 }}>STAGING</span>} />
                      <Badge status="default" text={<span style={{ fontSize: 11 }}>PROD</span>} />
                    </Space>
                  </div>

                  {/* 微服务与环境指标 */}
                  <Row
                    gutter={12}
                    style={{
                      marginBottom: 16,
                      background: "#f8f9fa",
                      padding: "10px 12px",
                      borderRadius: 6,
                    }}
                  >
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ fontSize: 12 }}>{t({ id: "titan.projects.statAppUnits", defaultMessage: "微服务单元" })}</span>}
                        value={proj.appCount || 0}
                        prefix={<AppstoreOutlined style={{ fontSize: 13, color: "#1677ff" }} />}
                        styles={{content: { fontSize: 18, fontWeight: 600 }}}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ fontSize: 12 }}>{t({ id: "titan.projects.statEnvGroups", defaultMessage: "交付环境组" })}</span>}
                        value={proj.envCount || 0}
                        prefix={<CloudServerOutlined style={{ fontSize: 13, color: "#52c41a" }} />}
                        styles={{content: { fontSize: 18, fontWeight: 600 }}}
                      />
                    </Col>
                  </Row>

                  {/* 底部操作栏 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: 12,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t({ id: "titan.projects.createdAt", defaultMessage: "创建于 {date}" }, { date: proj.createTime?.substring(0, 10) })}
                    </Text>
                    <Space>
                      {!isSelected ? (
                        <Button
                          size="small"
                          onClick={() => {
                            setCurrentProjectId(proj.id!);
                            message.success(
                              t(
                                { id: "titan.projects.switchedToProject", defaultMessage: "已切换生效项目：{name}" },
                                { name: proj.displayName || proj.name }
                              )
                            );
                          }}
                        >
                          {t({ id: "titan.projects.setAsCurrent", defaultMessage: "设为当前" })}
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        icon={<AppstoreOutlined />}
                        onClick={() => {
                          setCurrentProjectId(proj.id!);
                          navigate("/apps");
                        }}
                      >
                        {t({ id: "titan.projects.goApps", defaultMessage: "应用" })}
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<ArrowRightOutlined />}
                        onClick={() => {
                          setCurrentProjectId(proj.id!);
                          navigate("/environments");
                        }}
                      >
                        {t({ id: "titan.projects.goEnvs", defaultMessage: "环境大盘" })}
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* 视图模式 2：高密度表格列表 */
        <Card variant="borderless" styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            dataSource={filteredProjects}
            pagination={false}
            columns={[
              {
                title: t({ id: "titan.projects.colName", defaultMessage: "项目标识 / 名称" }),
                render: (_, record) => (
                  <Space size={12}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 6,
                        background: record.id === currentProjectId ? "#1677ff" : "#d9d9d9",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {getInitials(record.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{record.displayName || record.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.name}
                      </Text>
                    </div>
                  </Space>
                ),
              },
              {
                title: t({ id: "titan.projects.colDeliveryMode", defaultMessage: "交付模式" }),
                render: () => <Tag color="blue">Kubernetes YAML</Tag>,
              },
              {
                title: t({ id: "titan.projects.colAppCount", defaultMessage: "微服务数量" }),
                dataIndex: "appCount",
                render: (cnt) => (
                  <Space>
                    <AppstoreOutlined style={{ color: "#1677ff" }} />
                    <Text strong>{cnt || 0}</Text>
                  </Space>
                ),
              },
              {
                title: t({ id: "titan.projects.colEnvCount", defaultMessage: "交付环境" }),
                dataIndex: "envCount",
                render: (cnt) => (
                  <Space>
                    <CloudServerOutlined style={{ color: "#52c41a" }} />
                    <Text strong>{cnt || 0}</Text>
                  </Space>
                ),
              },
              {
                title: t({ id: "titan.projects.colStatus", defaultMessage: "当前状态" }),
                render: (_, record) =>
                  record.id === currentProjectId ? (
                    <Tag color="processing" icon={<CheckCircleOutlined />}>
                      {t({ id: "titan.projects.tagActive", defaultMessage: "当前生效" })}
                    </Tag>
                  ) : (
                    <Tag color="default">{t({ id: "titan.projects.tagReady", defaultMessage: "就绪" })}</Tag>
                  ),
              },
              {
                title: t({ id: "titan.common.createTime", defaultMessage: "创建时间" }),
                dataIndex: "createTime",
                render: (time) => <Text type="secondary">{time?.substring(0, 16)}</Text>,
              },
              {
                title: t({ id: "titan.common.action", defaultMessage: "操作" }),
                render: (_, record) => (
                  <Space>
                    {record.id !== currentProjectId && (
                      <Button
                        size="small"
                        onClick={() => {
                          setCurrentProjectId(record.id!);
                          message.success(
                            t(
                              { id: "titan.projects.switchedToProject", defaultMessage: "已切换生效项目：{name}" },
                              { name: record.displayName || record.name }
                            )
                          );
                        }}
                      >
                        {t({ id: "titan.projects.setAsCurrent", defaultMessage: "设为当前" })}
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<AppstoreOutlined />}
                      onClick={() => {
                        setCurrentProjectId(record.id!);
                        navigate("/apps");
                      }}
                    >
                      {t({ id: "titan.projects.goAppsTable", defaultMessage: "服务应用" })}
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<ArrowRightOutlined />}
                      onClick={() => {
                        setCurrentProjectId(record.id!);
                        navigate("/environments");
                      }}
                    >
                      {t({ id: "titan.projects.enterEnvs", defaultMessage: "进入环境" })}
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* 新建项目 Modal */}
      <Modal
        title={t({ id: "titan.projects.modalTitle", defaultMessage: "新建交付项目" })}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item
            name="name"
            label={t({ id: "titan.projects.labelSlug", defaultMessage: "项目唯一标识 (Slug)" })}
            rules={[
              { required: true, message: t({ id: "titan.projects.ruleSlugRequired", defaultMessage: "请输入项目英文标识" }) },
              { pattern: /^[a-z0-9-]+$/, message: t({ id: "titan.projects.ruleSlugPattern", defaultMessage: "仅支持小写字母、数字及中划线" }) },
            ]}
          >
            <Input placeholder={t({ id: "titan.projects.placeholderSlug", defaultMessage: "例如: mall-center / ai-hub" })} />
          </Form.Item>
          <Form.Item
            name="displayName"
            label={t({ id: "titan.projects.labelDisplayName", defaultMessage: "项目显示名称" })}
            rules={[{ required: true, message: t({ id: "titan.projects.ruleDisplayName", defaultMessage: "请输入显示名称" }) }]}
          >
            <Input placeholder={t({ id: "titan.projects.placeholderDisplayName", defaultMessage: "例如: 电商微服务中台" })} />
          </Form.Item>
          <Form.Item name="description" label={t({ id: "titan.projects.labelDescription", defaultMessage: "项目描述" })}>
            <Input.TextArea rows={3} placeholder={t({ id: "titan.projects.placeholderDescription", defaultMessage: "简要说明本项目的业务边界与包含的服务单元" })} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProjectsPage;
