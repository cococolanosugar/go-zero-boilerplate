import React, { useState, useEffect, useMemo } from "react";
import {
  App as AntdApp,
  Row,
  Col,
  Card,
  Input,
  Radio,
  Tag,
  Space,
  Button,
  Typography,
  Tooltip,
  Skeleton,
  Empty,
  Segmented,
  Flex,
  theme,
} from "antd";
import {
  SearchOutlined,
  CopyOutlined,
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
  ExportOutlined,
  ReloadOutlined,
  DeploymentUnitOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { getPortalNavList, type PortalNavDTO } from "@zero/api";
import { copyToClipboard } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";
import { resolveNavUrl, filterNavList } from "../../utils/navHelper";

const { Text, Title, Paragraph } = Typography;

// 预设分类主题色彩配置
const CATEGORY_STYLE: Record<
  string,
  { tagColor: string; bgLight: string; textColor: string }
> = {
  服务治理: { tagColor: "cyan", bgLight: "#e6fffb", textColor: "#13c2c2" },
  任务引擎: { tagColor: "purple", bgLight: "#f9f0ff", textColor: "#722ed1" },
  身份认证: { tagColor: "blue", bgLight: "#e6f4ff", textColor: "#1677ff" },
  开发文档: { tagColor: "green", bgLight: "#f6ffed", textColor: "#52c41a" },
  核心门户: { tagColor: "geekblue", bgLight: "#f0f5ff", textColor: "#2f54eb" },
  监控运维: { tagColor: "orange", bgLight: "#fff7e6", textColor: "#fa8c16" },
};

// 预设环境分组色彩配置
const ENV_CONFIG: Record<
  string,
  { label: string; tagColor: string }
> = {
  common: { label: "通用支撑", tagColor: "blue" },
  prod: { label: "生产 PROD", tagColor: "red" },
  pre: { label: "预发 PRE", tagColor: "orange" },
  test: { label: "测试 TEST", tagColor: "green" },
  dev: { label: "开发 DEV", tagColor: "cyan" },
};

// 混合图标渲染器（兼容 Antd 图标名称与静态/在线图片地址）
const renderNavIcon = (icon?: string, category = "", size = 22) => {
  const catStyle = CATEGORY_STYLE[category] || {
    bgLight: "#f5f5f5",
    textColor: "#1677ff",
  };

  if (!icon) {
    return <GlobalOutlined style={{ fontSize: size, color: catStyle.textColor }} />;
  }

  if (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("/")
  ) {
    return (
      <img
        src={icon}
        alt="icon"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: 4,
        }}
      />
    );
  }

  const iconStyle: React.CSSProperties = {
    fontSize: size,
    color: catStyle.textColor,
  };

  switch (icon) {
    case "CloudServerOutlined":
      return <CloudServerOutlined style={iconStyle} />;
    case "SafetyCertificateOutlined":
      return <SafetyCertificateOutlined style={iconStyle} />;
    case "KeyOutlined":
      return <KeyOutlined style={iconStyle} />;
    case "BookOutlined":
      return <BookOutlined style={iconStyle} />;
    case "DashboardOutlined":
      return <DashboardOutlined style={iconStyle} />;
    case "RocketOutlined":
      return <RocketOutlined style={iconStyle} />;
    case "ApiOutlined":
      return <ApiOutlined style={iconStyle} />;
    case "CompassOutlined":
      return <CompassOutlined style={iconStyle} />;
    case "GlobalOutlined":
      return <GlobalOutlined style={iconStyle} />;
    case "SettingOutlined":
      return <SettingOutlined style={iconStyle} />;
    case "DatabaseOutlined":
      return <DatabaseOutlined style={iconStyle} />;
    case "ClusterOutlined":
      return <ClusterOutlined style={iconStyle} />;
    case "DeploymentUnitOutlined":
      return <DeploymentUnitOutlined style={iconStyle} />;
    case "CustomerServiceOutlined":
      return <CustomerServiceOutlined style={iconStyle} />;
    case "AuditOutlined":
      return <AuditOutlined style={iconStyle} />;
    default:
      return <AppstoreOutlined style={iconStyle} />;
  }
};

export const NavigationPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const { token } = theme.useToken();

  const [loading, setLoading] = useState(true);
  const [navList, setNavList] = useState<PortalNavDTO[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // 获取公开导航数据
  const fetchNavList = async () => {
    setLoading(true);
    try {
      const res = await getPortalNavList({ status: 1 });
      setNavList(res.list || []);
    } catch (err: any) {
      message.error(err.message || "获取网址导航数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavList();
  }, []);

  // 统计各环境数量
  const envCounts = useMemo(() => {
    const map = new Map<string, number>();
    navList.forEach((item) => {
      const e = item.env || "common";
      map.set(e, (map.get(e) || 0) + 1);
    });
    return map;
  }, [navList]);

  // 提取可用分类及其统计数量 (联动当前选中的环境)
  const categories = useMemo(() => {
    const source = selectedEnv === "ALL"
      ? navList
      : navList.filter((item) => (item.env || "common") === selectedEnv);

    const map = new Map<string, number>();
    source.forEach((item) => {
      if (item.category) {
        map.set(item.category, (map.get(item.category) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [navList, selectedEnv]);

  // 过滤后的站点列表
  const filteredList = useMemo(() => {
    return filterNavList(navList, selectedCategory, searchKeyword, selectedEnv);
  }, [navList, selectedCategory, searchKeyword, selectedEnv]);

  // 复制并提示
  const handleCopyUrl = (resolvedUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(resolvedUrl);
    message.success(
      formatMessage({ id: "nav.copied", defaultMessage: "网址已复制到剪贴板" })
    );
  };

  return (
    <PageContainer
      header={{
        title: (
          <Space align="center" size={10}>
            <CompassOutlined style={{ color: token.colorPrimary, fontSize: 24 }} />
            <span>
              {formatMessage({
                id: "nav.title",
                defaultMessage: "企业网址导航",
              })}
            </span>
          </Space>
        ),
        subTitle: formatMessage({
          id: "nav.subTitle",
          defaultMessage:
            "汇聚企业内部治理中心、任务引擎、开发文档与核心中后台系统的统一快捷导航工作台",
        }),
        extra: [
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchNavList}
          >
            刷新数据
          </Button>,
        ],
      }}
    >
      {/* 搜索、环境与分类过滤栏 */}
      <Card
        variant="borderless"
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        <Flex vertical gap={16}>
          {/* 顶层环境分段控制器与搜索框 */}
          <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
            <Flex align="center" gap={10} wrap="wrap">
              <Text strong style={{ color: token.colorTextSecondary }}>
                {formatMessage({ id: "nav.envFilter", defaultMessage: "环境分组：" })}
              </Text>
              <Segmented
                value={selectedEnv}
                onChange={(val) => {
                  setSelectedEnv(val as string);
                  setSelectedCategory("ALL");
                }}
                options={[
                  {
                    label: `全部 (${navList.length})`,
                    value: "ALL",
                  },
                  {
                    label: `通用支撑 (${envCounts.get("common") || 0})`,
                    value: "common",
                  },
                  {
                    label: `生产环境 PROD (${envCounts.get("prod") || 0})`,
                    value: "prod",
                  },
                  {
                    label: `预发环境 PRE (${envCounts.get("pre") || 0})`,
                    value: "pre",
                  },
                  {
                    label: `测试环境 TEST (${envCounts.get("test") || 0})`,
                    value: "test",
                  },
                  {
                    label: `开发联调 DEV (${envCounts.get("dev") || 0})`,
                    value: "dev",
                  },
                ]}
              />
            </Flex>

            <Input
              allowClear
              style={{ maxWidth: 300, minWidth: 220 }}
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder={formatMessage({
                id: "nav.searchPlaceholder",
                defaultMessage: "搜索系统名称、分类、环境或标签...",
              })}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Flex>

          {/* 二级分类筛选栏 */}
          <Flex align="center" gap={10} wrap="wrap">
            <Text type="secondary" style={{ fontSize: 13 }}>
              {formatMessage({ id: "nav.categoryFilter", defaultMessage: "业务分类：" })}
            </Text>
            <Radio.Group
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="ALL">
                {formatMessage({
                  id: "nav.allCategory",
                  defaultMessage: "全部业务",
                })}{" "}
                ({selectedEnv === "ALL" ? navList.length : (envCounts.get(selectedEnv) || 0)})
              </Radio.Button>
              {categories.map((c) => (
                <Radio.Button key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </Radio.Button>
              ))}
            </Radio.Group>
          </Flex>
        </Flex>
      </Card>

      {/* 导航卡片列表 */}
      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={i}>
              <Card variant="borderless" style={{ borderRadius: 8 }}>
                <Skeleton active avatar paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredList.length === 0 ? (
        <Card variant="borderless" style={{ borderRadius: 8, textAlign: "center", padding: "40px 0" }}>
          <Empty
            description={formatMessage({
              id: "nav.empty",
              defaultMessage: "未找到匹配的内部系统",
            })}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredList.map((item) => {
            const resolvedUrl = resolveNavUrl(item.url);
            const hasHostPlaceholder = item.url.includes("{HOST}");
            const catStyle = CATEGORY_STYLE[item.category] || {
              tagColor: "default",
              bgLight: "#f5f5f5",
              textColor: token.colorPrimary,
            };
            const tags = item.tags
              ? item.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : [];

            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item.id}>
                <Card
                  hoverable
                  variant="borderless"
                  style={{
                    borderRadius: 8,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  styles={{
                    body: {
                      padding: 16,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    },
                  }}
                  actions={[
                    <Tooltip
                      key="visit"
                      title={formatMessage({
                        id: "nav.visit",
                        defaultMessage: "直达访问",
                      })}
                    >
                      <a
                        href={resolvedUrl}
                        target={item.target || "_blank"}
                        rel="noreferrer"
                        style={{
                          color: token.colorPrimary,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 13,
                        }}
                      >
                        <ExportOutlined />
                        <span>
                          {formatMessage({
                            id: "nav.visit",
                            defaultMessage: "直达访问",
                          })}
                        </span>
                      </a>
                    </Tooltip>,
                    <Tooltip
                      key="copy"
                      title={formatMessage({
                        id: "nav.copy",
                        defaultMessage: "复制网址",
                      })}
                    >
                      <span
                        onClick={(e) => handleCopyUrl(resolvedUrl, e)}
                        style={{
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 13,
                          color: token.colorTextSecondary,
                        }}
                      >
                        <CopyOutlined />
                        <span>
                          {formatMessage({
                            id: "nav.copy",
                            defaultMessage: "复制网址",
                          })}
                        </span>
                      </span>
                    </Tooltip>,
                  ]}
                >
                  <div style={{ flex: 1 }}>
                    {/* 卡片头部：图标、标题、分类 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: catStyle.bgLight,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {renderNavIcon(item.icon, item.category, 24)}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 4,
                          }}
                        >
                          <Title
                            level={5}
                            ellipsis={{ tooltip: item.title }}
                            style={{
                              margin: 0,
                              fontSize: 15,
                              fontWeight: 600,
                              color: token.colorTextHeading,
                            }}
                          >
                            {item.title}
                          </Title>
                        </div>

                        <div style={{ marginTop: 4 }}>
                          <Tag
                            color={ENV_CONFIG[item.env || "common"]?.tagColor || "default"}
                            variant="filled"
                            style={{ fontSize: 11, marginInlineEnd: 4 }}
                          >
                            {ENV_CONFIG[item.env || "common"]?.label || (item.env || "common").toUpperCase()}
                          </Tag>
                          <Tag
                            color={catStyle.tagColor}
                            variant="filled"
                            style={{ fontSize: 11, marginInlineEnd: 4 }}
                          >
                            {item.category}
                          </Tag>
                          {hasHostPlaceholder && (
                            <Tooltip
                              title={formatMessage({
                                id: "nav.hostTooltip",
                                defaultMessage: "自动适配当前访问主机名/内网IP",
                              })}
                            >
                              <Tag
                                color="processing"
                                variant="filled"
                                style={{ fontSize: 10, cursor: "help" }}
                              >
                                {formatMessage({
                                  id: "nav.hostBadge",
                                  defaultMessage: "动态主机",
                                })}
                              </Tag>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 站点简介 */}
                    <Paragraph
                      ellipsis={{ rows: 2, tooltip: item.description }}
                      style={{
                        fontSize: 12,
                        color: token.colorTextSecondary,
                        minHeight: 36,
                        marginBottom: 8,
                        lineHeight: "18px",
                      }}
                    >
                      {item.description || "暂无站点功能详细介绍。"}
                    </Paragraph>

                    {/* 标签 */}
                    {tags.length > 0 && (
                      <div style={{ marginBottom: 8, minHeight: 22 }}>
                        {tags.map((tag) => (
                          <Tag
                            key={tag}
                            style={{
                              fontSize: 10,
                              lineHeight: "18px",
                              padding: "0 4px",
                              marginInlineEnd: 4,
                              marginBottom: 2,
                            }}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}

                    {/* 解析后的真实 URL 预览 */}
                    <div
                      style={{
                        background: token.colorFillAlter,
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        color: token.colorTextTertiary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: "monospace",
                      }}
                      title={resolvedUrl}
                    >
                      {resolvedUrl}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </PageContainer>
  );
};

export default NavigationPage;
