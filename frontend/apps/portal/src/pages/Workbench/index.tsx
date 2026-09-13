import React, { useState } from "react";
import { App as AntdApp, Button, Space, Tag, Typography, Row, Col, Alert, Spin, Flex } from "antd";
import {
  PlayCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  ApiOutlined,
  DashboardOutlined,
  UserOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { useOutletContext } from "react-router-dom";
import {
  getDashboardOverview,
  getUserProfile,
  getPortalNavList,
  getUserInfo,
} from "@zero/api";
import { useAuth } from "../../contexts/AuthContext";
import { useIntl } from "../../contexts/LocaleContext";

export const WorkbenchPage: React.FC = () => {
  const { onOpenLogin } = useOutletContext<{ onOpenLogin: () => void }>();
  const { message } = AntdApp.useApp();
  const { isLoggedIn, profile } = useAuth();
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [activeApi, setActiveApi] = useState<string>("");
  const [responseResult, setResponseResult] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const testApi = async (name: string, fetcher: () => Promise<any>) => {
    setActiveApi(name);
    setLoading(true);
    setResponseResult(null);
    setLatency(null);
    const start = performance.now();

    try {
      const res = await fetcher();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setResponseResult(res);
      message.success(`接口 [${name}] 调用成功！`);
    } catch (err: any) {
      const end = performance.now();
      setLatency(Math.round(end - start));
      setResponseResult({
        error: true,
        code: err.code || 500,
        message: err.message || "请求失败",
        tip: !isLoggedIn ? "此接口需要登录态，请先登录账号" : undefined,
      });
      message.error(`接口调用失败: ${err.message || "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseResult) return;
    navigator.clipboard.writeText(JSON.stringify(responseResult, null, 2));
    setCopied(true);
    message.success(
      formatMessage({
        id: "workbench.copy.copied",
        defaultMessage: "已复制 JSON 响应内容至剪贴板",
      })
    );
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageContainer
      header={{
        title: formatMessage({
          id: "workbench.page.title",
          defaultMessage: "微服务网关实时联调工作台",
        }),
        subTitle: formatMessage({
          id: "workbench.page.desc",
          defaultMessage:
            "直接经由 @zero/api SDK 请求网关 (:8888)，体验前端多端大仓、JWT 身份透传与后端并发聚合能力。",
        }),
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {!isLoggedIn && (
          <Alert
            title={formatMessage({
              id: "workbench.alert.unlogin",
              defaultMessage: "当前处于未登录访客模式",
            })}
            description={
              <Space>
                <span>
                  {formatMessage({
                    id: "workbench.alert.unlogin.desc",
                    defaultMessage:
                      "大盘数据与网址导航等公开接口可直接调试；统一用户画像接口需要有效登录凭证。",
                  })}
                </span>
                <Button type="primary" size="small" onClick={onOpenLogin}>
                  {formatMessage({
                    id: "workbench.alert.unlogin.btn",
                    defaultMessage: "立即登录账号",
                  })}
                </Button>
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {isLoggedIn && profile && (
          <Alert
            title={`已登录画像: ${profile.realName || profile.username}`}
            description={`主体类型: ${profile.userType === "employee" ? "企业内部员工" : "外部业务客户"} | 所属部门: ${profile.deptName || "总部默认部门"} | 拥有角色: ${(profile.roles || []).join(", ") || "普通用户"}`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <ProCard
              title={formatMessage({
                id: "workbench.btn.test",
                defaultMessage: "可选测试接口",
              })}
              headerBordered
            >
              <Flex vertical gap={12} style={{ width: "100%" }}>
                <Button
                  block
                  type={activeApi === "大盘并发聚合" ? "primary" : "default"}
                  icon={<DashboardOutlined />}
                  style={{ textAlign: "left" }}
                  onClick={() =>
                    testApi("大盘并发聚合", () => getDashboardOverview({}))
                  }
                >
                  1. 大盘并发聚合 (mr.Finish)
                </Button>

                <Button
                  block
                  type={activeApi === "统一用户画像" ? "primary" : "default"}
                  icon={<UserOutlined />}
                  style={{ textAlign: "left" }}
                  onClick={() =>
                    testApi("统一用户画像", () => getUserProfile())
                  }
                >
                  2. 统一用户个人画像 (Dual-Identity)
                </Button>

                <Button
                  block
                  type={activeApi === "门户网址导航" ? "primary" : "default"}
                  icon={<CompassOutlined />}
                  style={{ textAlign: "left" }}
                  onClick={() =>
                    testApi("门户网址导航", () => getPortalNavList({}))
                  }
                >
                  3. 门户前台多环境网址导航
                </Button>

                <Button
                  block
                  type={activeApi === "客户主体信息" ? "primary" : "default"}
                  icon={<ApiOutlined />}
                  style={{ textAlign: "left" }}
                  onClick={() =>
                    testApi("客户主体信息", () => getUserInfo())
                  }
                >
                  4. 业务客户主体信息 (/user/info)
                </Button>
              </Flex>
            </ProCard>
          </Col>

          <Col xs={24} md={16}>
            <ProCard
              title={
                <Space>
                  <span>
                    {formatMessage({
                      id: "workbench.panel.response",
                      defaultMessage: "调用响应面板",
                    })}
                  </span>
                  {activeApi && <Tag color="purple">{activeApi}</Tag>}
                  {latency !== null && <Tag color="blue">{latency} ms</Tag>}
                </Space>
              }
              extra={
                responseResult && (
                  <Button
                    size="small"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                  >
                    {copied
                      ? formatMessage({
                          id: "workbench.copy.copied",
                          defaultMessage: "已复制",
                        })
                      : formatMessage({
                          id: "workbench.copy.btn",
                          defaultMessage: "复制 JSON",
                        })}
                  </Button>
                )
              }
              headerBordered
              style={{ minHeight: 400 }}
            >
              {loading ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <Spin
                    description={formatMessage({
                      id: "workbench.loading",
                      defaultMessage: "正在向网关发起请求...",
                    })}
                  />
                </div>
              ) : responseResult ? (
                <pre
                  style={{
                    background: "#1e1e1e",
                    color: "#d4d4d4",
                    padding: 16,
                    borderRadius: 8,
                    fontSize: 13,
                    maxHeight: 460,
                    overflow: "auto",
                    fontFamily: "Consolas, Menlo, Monaco, monospace",
                  }}
                >
                  {JSON.stringify(responseResult, null, 2)}
                </pre>
              ) : (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#8c8c8c" }}>
                  <PlayCircleOutlined style={{ fontSize: 40, marginBottom: 12 }} />
                  <div>
                    {formatMessage({
                      id: "workbench.empty.tip",
                      defaultMessage:
                        "点击左侧按钮向微服务网关发起请求，查看实时返回数据",
                    })}
                  </div>
                </div>
              )}
            </ProCard>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default WorkbenchPage;
