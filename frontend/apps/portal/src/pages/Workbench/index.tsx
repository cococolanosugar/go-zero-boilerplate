import React, { useState } from "react";
import { App as AntdApp, Button, Space, Tag, Typography, Row, Col, Alert, Spin, Flex } from "antd";
import {
  PlayCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  ApiOutlined,
  DashboardOutlined,
  UserOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import { useOutletContext } from "react-router-dom";
import {
  getDashboardOverview,
  getAdminProfile,
  getSysMenuTree,
  listSysApis,
} from "@zero/api";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Paragraph, Text } = Typography;

export const WorkbenchPage: React.FC = () => {
  const { onOpenLogin } = useOutletContext<{ onOpenLogin: () => void }>();
  const { message } = AntdApp.useApp();
  const { isLoggedIn, profile } = useAuth();
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
        tip: !isLoggedIn ? "此接口需要登录态，请先登录系统员工账号" : undefined,
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
    message.success("已复制 JSON 响应内容至剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>微服务网关实时联调工作台</Title>
        <Paragraph type="secondary">
          直接经由 <code>@zero/api</code> SDK 请求网关 (:8888)，体验前端多端大仓、JWT 身份透传与后端并发聚合能力。
        </Paragraph>
      </div>

      {!isLoggedIn && (
        <Alert
          title="当前未登录企业员工账号"
          description={
            <Space>
              <span>部分受保护的系统画像与权限接口需要有效凭证，您可以先登录测试账号 (默认: admin / 123456)。</span>
              <Button type="primary" size="small" onClick={onOpenLogin}>
                立即登录员工账号
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
          title={`已作为系统员工登录: ${profile.realName || profile.username}`}
          description={`所属部门: ${profile.deptName || "总部默认部门"} | 拥有角色: ${(profile.roles || []).join(", ") || "普通员工"}`}
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <ProCard title="可选测试接口" headerBordered>
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
                type={activeApi === "员工个人画像与权限" ? "primary" : "default"}
                icon={<UserOutlined />}
                style={{ textAlign: "left" }}
                onClick={() =>
                  testApi("员工个人画像与权限", () => getAdminProfile())
                }
              >
                2. 员工个人画像与权限
              </Button>

              <Button
                block
                type={activeApi === "全量菜单权限树" ? "primary" : "default"}
                icon={<MenuOutlined />}
                style={{ textAlign: "left" }}
                onClick={() =>
                  testApi("全量菜单权限树", () => getSysMenuTree())
                }
              >
                3. 全量系统菜单与按钮树
              </Button>

              <Button
                block
                type={activeApi === "接口字典列表" ? "primary" : "default"}
                icon={<ApiOutlined />}
                style={{ textAlign: "left" }}
                onClick={() =>
                  testApi("接口字典列表", () => listSysApis())
                }
              >
                4. 系统 API 字典列表
              </Button>
            </Flex>
          </ProCard>
        </Col>

        <Col xs={24} md={16}>
          <ProCard
            title={
              <Space>
                <span>调用响应面板</span>
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
                  {copied ? "已复制" : "复制 JSON"}
                </Button>
              )
            }
            headerBordered
            style={{ minHeight: 400 }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Spin description="正在向网关发起请求..." />
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
                <div>点击左侧按钮向微服务网关发起请求，查看实时返回数据</div>
              </div>
            )}
          </ProCard>
        </Col>
      </Row>
    </div>
  );
};

export default WorkbenchPage;
