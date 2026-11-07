import React, { useState, useMemo } from "react";
import {
  Card,
  Tabs,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  App,
  Badge,
  Spin,
  Alert,
} from "antd";
import {
  CopyOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  ConsoleSqlOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import type { ApiEndpointVO, SandboxResult, SupportedLanguage } from "../types";
import { generateCodeSnippet } from "../codeGenerator";

const { Text } = Typography;

interface ApiConsoleProps {
  endpoint: ApiEndpointVO;
  params: Record<string, any>;
  body: any;
  headers: Record<string, string>;
  sandboxResult: SandboxResult | null;
  onExecuteSandbox: () => void;
  executing: boolean;
  isLoggedIn: boolean;
  onOpenLogin?: () => void;
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({
  endpoint,
  params,
  body,
  headers,
  sandboxResult,
  onExecuteSandbox,
  executing,
  isLoggedIn,
  onOpenLogin,
}) => {
  const { message } = App.useApp();
  const [activeLang, setActiveLang] = useState<SupportedLanguage>("curl");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // 动态生成对应语言代码
  const codeSnippet = useMemo(() => {
    return generateCodeSnippet(activeLang, {
      endpoint,
      params,
      body,
      headers,
      host: `${host}:8888`,
    });
  }, [activeLang, endpoint, params, body, headers, host]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    message.success("代码片段已复制到剪贴板");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyResult = () => {
    if (!sandboxResult?.data) return;
    navigator.clipboard.writeText(JSON.stringify(sandboxResult.data, null, 2));
    setCopiedResult(true);
    message.success("响应结果已复制到剪贴板");
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return "error";
    if (status >= 200 && status < 300) return "success";
    if (status >= 400 && status < 500) return "warning";
    return "error";
  };

  return (
    <div style={{ padding: "16px 20px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 多语言代码生成区 */}
      <Card
        size="small"
        title={
          <Space size={6}>
            <CodeOutlined style={{ color: "#1890ff" }} />
            <span>客户端代码示例</span>
          </Space>
        }
        styles={{
          header: { fontSize: 13, fontWeight: 600, minHeight: 38 },
          body: { padding: 0 },
        }}
        extra={
          <Button
            type="text"
            size="small"
            icon={copiedCode ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
            onClick={handleCopyCode}
          >
            复制
          </Button>
        }
      >
        <Tabs
          size="small"
          activeKey={activeLang}
          onChange={(k) => setActiveLang(k as SupportedLanguage)}
          tabBarStyle={{ padding: "0 12px", margin: 0, borderBottom: "1px solid #303030" }}
          items={[
            { key: "curl", label: "cURL" },
            { key: "typescript", label: "TypeScript SDK" },
            { key: "go", label: "Go" },
            { key: "python", label: "Python" },
          ]}
        />
        <pre
          style={{
            margin: 0,
            padding: "12px 14px",
            backgroundColor: "#141414",
            color: "#e6e6e6",
            fontSize: 11,
            lineHeight: 1.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            maxHeight: 220,
            overflowY: "auto",
            overflowX: "auto",
            borderRadius: "0 0 8px 8px",
          }}
        >
          {codeSnippet}
        </pre>
      </Card>

      {/* 实时调试触发操作栏 */}
      <Card
        size="small"
        style={{
          backgroundColor: "#f5f5f5",
          border: "1px solid #e8e8e8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#262626" }}>
              网关调试沙箱 (Live Sandbox)
            </div>
            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
              目标服务: <code>http://{host}:8888</code>
            </div>
          </div>

          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={executing}
            onClick={onExecuteSandbox}
            style={{ fontWeight: 500 }}
          >
            发送请求 (Send)
          </Button>
        </div>
      </Card>

      {/* 沙箱执行响应控制台 */}
      <Card
        size="small"
        title={
          <Space size={6}>
            <ConsoleSqlOutlined style={{ color: "#52c41a" }} />
            <span>沙箱运行结果</span>
          </Space>
        }
        styles={{
          header: { fontSize: 13, fontWeight: 600, minHeight: 38 },
          body: { padding: 0 },
        }}
        extra={
          sandboxResult && (
            <Space size={8}>
              {sandboxResult.status ? (
                <Tag color={getStatusColor(sandboxResult.status)}>
                  {sandboxResult.status} {sandboxResult.statusText}
                </Tag>
              ) : (
                <Tag color="error">ERROR</Tag>
              )}
              {sandboxResult.latencyMs !== undefined && (
                <Tag icon={<ClockCircleOutlined />} color="default">
                  {sandboxResult.latencyMs}ms
                </Tag>
              )}
              <Button
                type="text"
                size="small"
                icon={copiedResult ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                onClick={handleCopyResult}
                disabled={!sandboxResult?.data}
              >
                复制响应
              </Button>
            </Space>
          )
        }
      >
        <Spin spinning={executing}>
          {!sandboxResult ? (
            <div
              style={{
                padding: "36px 16px",
                textAlign: "center",
                color: "#8c8c8c",
                fontSize: 12,
                backgroundColor: "#fafafa",
              }}
            >
              <ApiOutlined style={{ fontSize: 24, marginBottom: 8, color: "#bfbfbf", display: "block" }} />
              准备就绪，点击上方【发送请求】发起真实调用测试
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                padding: "12px 14px",
                backgroundColor: "#1e1e1e",
                color: sandboxResult.error ? "#ff7875" : "#00ff66",
                fontSize: 11,
                lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                minHeight: 180,
                maxHeight: 360,
                overflowY: "auto",
                overflowX: "auto",
                borderRadius: "0 0 8px 8px",
              }}
            >
              {typeof sandboxResult.data === "object"
                ? JSON.stringify(sandboxResult.data, null, 2)
                : sandboxResult.data || "[无响应正文]"}
            </pre>
          )}
        </Spin>
      </Card>
    </div>
  );
};
