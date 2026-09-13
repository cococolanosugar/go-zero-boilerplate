import React, { useRef, useState } from "react";
import {
  App as AntdApp,
  Button,
  Space,
  Flex,
  Tag,
  Popconfirm,
  Tooltip,
  Badge,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  LinkOutlined,
  CompassOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  BookOutlined,
  DashboardOutlined,
  RocketOutlined,
  ApiOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ClusterOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  listSysPortalNav,
  createSysPortalNav,
  updateSysPortalNav,
  deleteSysPortalNav,
  type PortalNavDTO,
} from "@zero/api";
import { PERMISSIONS, copyToClipboard } from "@zero/shared";
import { Access } from "../../../components/Access";
import { useIntl } from "../../../contexts/LocaleContext";

const { Text } = Typography;

export type SysPortalNavRecord = PortalNavDTO;

// 常用预设图标库
const ICON_OPTIONS = [
  { label: "CloudServer (云服务器/任务引擎)", value: "CloudServerOutlined", icon: <CloudServerOutlined /> },
  { label: "SafetyCertificate (安全认证/服务治理)", value: "SafetyCertificateOutlined", icon: <SafetyCertificateOutlined /> },
  { label: "Key (密钥/身份认证)", value: "KeyOutlined", icon: <KeyOutlined /> },
  { label: "Book (文档/知识库)", value: "BookOutlined", icon: <BookOutlined /> },
  { label: "Dashboard (仪表盘/控制台)", value: "DashboardOutlined", icon: <DashboardOutlined /> },
  { label: "Rocket (火箭/技术门户)", value: "RocketOutlined", icon: <RocketOutlined /> },
  { label: "Api (接口契约)", value: "ApiOutlined", icon: <ApiOutlined /> },
  { label: "Compass (指南针/导航)", value: "CompassOutlined", icon: <CompassOutlined /> },
  { label: "Global (全球网络/外网)", value: "GlobalOutlined", icon: <GlobalOutlined /> },
  { label: "Setting (系统配置)", value: "SettingOutlined", icon: <SettingOutlined /> },
  { label: "Database (数据库/持久化)", value: "DatabaseOutlined", icon: <DatabaseOutlined /> },
  { label: "Cluster (集群/分布式)", value: "ClusterOutlined", icon: <ClusterOutlined /> },
  { label: "Appstore (应用中心/默认)", value: "AppstoreOutlined", icon: <AppstoreOutlined /> },
];

// 图标智能渲染器
export const renderNavIcon = (icon?: string, size = 18) => {
  if (!icon) return <GlobalOutlined style={{ fontSize: size }} />;
  if (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/")) {
    return (
      <img
        src={icon}
        alt="icon"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: 4,
          verticalAlign: "middle",
        }}
      />
    );
  }

  switch (icon) {
    case "CloudServerOutlined":
      return <CloudServerOutlined style={{ fontSize: size }} />;
    case "SafetyCertificateOutlined":
      return <SafetyCertificateOutlined style={{ fontSize: size }} />;
    case "KeyOutlined":
      return <KeyOutlined style={{ fontSize: size }} />;
    case "BookOutlined":
      return <BookOutlined style={{ fontSize: size }} />;
    case "DashboardOutlined":
      return <DashboardOutlined style={{ fontSize: size }} />;
    case "RocketOutlined":
      return <RocketOutlined style={{ fontSize: size }} />;
    case "ApiOutlined":
      return <ApiOutlined style={{ fontSize: size }} />;
    case "CompassOutlined":
      return <CompassOutlined style={{ fontSize: size }} />;
    case "GlobalOutlined":
      return <GlobalOutlined style={{ fontSize: size }} />;
    case "SettingOutlined":
      return <SettingOutlined style={{ fontSize: size }} />;
    case "DatabaseOutlined":
      return <DatabaseOutlined style={{ fontSize: size }} />;
    case "ClusterOutlined":
      return <ClusterOutlined style={{ fontSize: size }} />;
    default:
      return <AppstoreOutlined style={{ fontSize: size }} />;
  }
};

// 分类配色映射表
const CATEGORY_COLORS: Record<string, string> = {
  服务治理: "cyan",
  任务引擎: "purple",
  身份认证: "blue",
  开发文档: "green",
  核心门户: "geekblue",
  监控运维: "orange",
};

// 环境分组预设与色彩映射
export const ENV_OPTIONS = [
  { label: "通用支撑 (common)", value: "common" },
  { label: "生产环境 (prod)", value: "prod" },
  { label: "预发环境 (pre)", value: "pre" },
  { label: "测试环境 (test)", value: "test" },
  { label: "开发联调 (dev)", value: "dev" },
];

export const ENV_COLORS: Record<string, string> = {
  common: "blue",
  prod: "red",
  pre: "orange",
  test: "green",
  dev: "cyan",
};

export const ENV_LABELS: Record<string, string> = {
  common: "通用支撑",
  prod: "生产 PROD",
  pre: "预发 PRE",
  test: "测试 TEST",
  dev: "开发 DEV",
};

export const NavigationPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysPortalNavRecord | null>(null);

  const handleEdit = (record: SysPortalNavRecord) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSysPortalNav({}, id);
      message.success(
        formatMessage({ id: "common.deleteSuccess", defaultMessage: "删除成功" })
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "删除失败");
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        category: values.category,
        env: values.env || "common",
        url: values.url,
        icon: values.icon || "AppstoreOutlined",
        description: values.description || "",
        tags: values.tags || "",
        sort: Number(values.sort) || 0,
        target: values.target || "_blank",
        status: Number(values.status) ?? 1,
      };

      if (currentRow && currentRow.id) {
        await updateSysPortalNav({}, payload, currentRow.id);
        message.success(
          formatMessage({ id: "common.updateSuccess", defaultMessage: "更新成功" })
        );
      } else {
        await createSysPortalNav(payload);
        message.success(
          formatMessage({ id: "common.createSuccess", defaultMessage: "创建成功" })
        );
      }
      setModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (err: any) {
      message.error(err.message || "操作失败");
      return false;
    }
  };

  const columns: ProColumns<SysPortalNavRecord>[] = [
    {
      title: "ID",
      dataIndex: "id",
      valueType: "digit",
      hideInSearch: true,
      width: 60,
    },
    {
      title: "图标",
      dataIndex: "icon",
      hideInSearch: true,
      width: 65,
      align: "center",
      render: (_, record) => (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {renderNavIcon(record.icon, 20)}
        </span>
      ),
    },
    {
      title: "站点名称",
      dataIndex: "title",
      copyable: true,
      ellipsis: true,
      width: 180,
      render: (_, record) => (
        <Flex vertical gap={2}>
          <Text strong>{record.title}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>
              {record.description}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "所属分类",
      dataIndex: "category",
      width: 110,
      render: (_, record) => (
        <Tag color={CATEGORY_COLORS[record.category] || "default"}>
          {record.category}
        </Tag>
      ),
    },
    {
      title: "环境分组",
      dataIndex: "env",
      width: 120,
      valueEnum: {
        "": { text: "全部环境" },
        common: { text: "通用支撑 (common)" },
        prod: { text: "生产环境 (prod)" },
        pre: { text: "预发环境 (pre)" },
        test: { text: "测试环境 (test)" },
        dev: { text: "开发联调 (dev)" },
      },
      render: (_, record) => {
        const envVal = record.env || "common";
        const color = ENV_COLORS[envVal] || "default";
        const label = ENV_LABELS[envVal] || envVal.toUpperCase();
        return (
          <Tag color={color} variant="filled">
            {label}
          </Tag>
        );
      },
    },
    {
      title: "访问网址 (URL)",
      dataIndex: "url",
      ellipsis: true,
      render: (_, record) => {
        const hasHostPlaceholder = record.url.includes("{HOST}");
        const resolvedUrl = record.url.replace("{HOST}", window.location.hostname || "127.0.0.1");
        return (
          <Space size={6} wrap>
            <a href={resolvedUrl} target={record.target || "_blank"} rel="noreferrer">
              <Space size={4}>
                <Text code ellipsis style={{ maxWidth: 220 }}>
                  {record.url}
                </Text>
                <LinkOutlined />
              </Space>
            </a>
            {hasHostPlaceholder && (
              <Tooltip title="支持 {HOST} 动态主机插值，自适应当前访问域名或内网 IP">
                <Tag color="processing" variant="filled" style={{ fontSize: 11, cursor: "help" }}>
                  动态主机
                </Tag>
              </Tooltip>
            )}
            <Tooltip title="复制完整网址">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  copyToClipboard(resolvedUrl);
                  message.success("网址已复制到剪贴板");
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "标签",
      dataIndex: "tags",
      hideInSearch: true,
      width: 140,
      render: (_, record) => {
        if (!record.tags) return "-";
        const tagList = record.tags.split(",").map((t) => t.trim()).filter(Boolean);
        return (
          <Space size={[0, 4]} wrap>
            {tagList.map((t) => (
              <Tag key={t} style={{ fontSize: 11, marginInlineEnd: 4 }}>
                {t}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "排序权重",
      dataIndex: "sort",
      valueType: "digit",
      hideInSearch: true,
      width: 90,
      sorter: (a, b) => a.sort - b.sort,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      valueEnum: {
        "-1": { text: "全部" },
        "1": { text: "启用", status: "Success" },
        "0": { text: "停用", status: "Default" },
      },
      render: (_, record) => (
        <Badge
          status={record.status === 1 ? "success" : "default"}
          text={record.status === 1 ? "启用" : "停用"}
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 130,
      render: (_, record) => [
        <Access key="edit" permission={PERMISSIONS.NAV_EDIT}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Access>,
        <Access key="delete" permission={PERMISSIONS.NAV_DELETE}>
          <Popconfirm
            title="确定要删除该导航站点吗？"
            description="删除后门户将不再显示该站点快捷入口。"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Access>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: "门户网址导航配置",
        breadcrumb: {
          items: [
            { title: "首页", path: "/" },
            { title: "网址导航配置" },
          ],
        },
      }}
    >
      <ProTable<SysPortalNavRecord>
        headerTitle="网址导航数据源"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        toolBarRender={() => [
          <Access key="add" permission={PERMISSIONS.NAV_ADD}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建导航站点
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          try {
            const res = await listSysPortalNav({
              page: params.current || 1,
              pageSize: params.pageSize || 10,
              title: (params as any).title,
              category: (params as any).category,
              env: (params as any).env || undefined,
              status: params.status !== undefined && params.status !== "-1" ? Number(params.status) : -1,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err: any) {
            message.error(err.message || "获取导航列表失败");
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "编辑导航站点" : "新建导航站点"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={
          currentRow || {
            category: "服务治理",
            env: "common",
            icon: "AppstoreOutlined",
            target: "_blank",
            status: 1,
            sort: 50,
          }
        }
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        onFinish={handleFormSubmit}
      >
        <ProFormText
          name="title"
          label="站点名称"
          placeholder="如：Temporal Web 控制台"
          rules={[{ required: true, message: "请输入导航站点名称" }]}
        />

        <ProFormSelect
          name="category"
          label="所属分类"
          placeholder="请选择或输入分类名称"
          rules={[{ required: true, message: "请选择或输入分类" }]}
          fieldProps={{
            showSearch: true,
            allowClear: true,
          }}
          options={[
            { label: "服务治理", value: "服务治理" },
            { label: "任务引擎", value: "任务引擎" },
            { label: "身份认证", value: "身份认证" },
            { label: "开发文档", value: "开发文档" },
            { label: "核心门户", value: "核心门户" },
            { label: "监控运维", value: "监控运维" },
          ]}
        />

        <ProFormSelect
          name="env"
          label="所属环境/分组"
          placeholder="请选择所属环境/分组"
          rules={[{ required: true, message: "请选择所属环境/分组" }]}
          options={ENV_OPTIONS}
        />

        <ProFormText
          name="url"
          label="访问网址 (URL)"
          placeholder="如：http://{HOST}:8233 或 https://example.com"
          tooltip="支持使用 {HOST} 占位符，前端会自动解析替换为用户当前浏览器 Host（支持内网 IP 与多网卡访问）"
          rules={[
            { required: true, message: "请输入站点访问网址" },
            {
              pattern: /^(https?:\/\/|\/)/,
              message: "网址格式必须以 http:// 或 https:// 或 / 开头",
            },
          ]}
        />

        <ProFormSelect
          name="icon"
          label="图标"
          placeholder="请选择图标或直接输入 Antd 图标名称/图片链接"
          options={ICON_OPTIONS.map((item) => ({
            label: (
              <Space size={6}>
                {item.icon}
                <span>{item.label}</span>
              </Space>
            ),
            value: item.value,
          }))}
          fieldProps={{
            showSearch: true,
            allowClear: true,
          }}
        />

        <ProFormText
          name="tags"
          label="标签"
          placeholder="逗号分隔，如：Temporal,Saga,Cron"
          tooltip="多个标签使用半角逗号分隔，将在前台卡片中高亮展示"
        />

        <ProFormDigit
          name="sort"
          label="排序权重"
          tooltip="数值越大在前台展示时排序越靠前"
          min={0}
          max={99999}
          fieldProps={{ precision: 0 }}
        />

        <ProFormRadio.Group
          name="target"
          label="打开方式"
          options={[
            { label: "新窗口打开 (_blank)", value: "_blank" },
            { label: "当前窗口跳转 (_self)", value: "_self" },
          ]}
        />

        <ProFormRadio.Group
          name="status"
          label="启用状态"
          options={[
            { label: "启用", value: 1 },
            { label: "停用", value: 0 },
          ]}
        />

        <ProFormTextArea
          name="description"
          label="站点描述"
          placeholder="简要介绍该系统的主功能、面向人群或注意事项"
          fieldProps={{ rows: 3, maxLength: 255, showCount: true }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default NavigationPage;
