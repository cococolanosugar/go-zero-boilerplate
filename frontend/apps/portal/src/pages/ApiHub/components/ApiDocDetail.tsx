import React, { useState } from "react";
import {
  Typography,
  Tag,
  Space,
  Input,
  Form,
  Card,
  Button,
  Alert,
  Divider,
  Tooltip,
  App,
} from "antd";
import {
  CopyOutlined,
  CheckOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { ApiEndpointVO, HttpMethod } from "../types";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ApiDocDetailProps {
  endpoint: ApiEndpointVO;
  params: Record<string, any>;
  onChangeParams: (params: Record<string, any>) => void;
  body: any;
  onChangeBody: (body: any) => void;
  isLoggedIn: boolean;
  onOpenLogin?: () => void;
}

const METHOD_COLOR_MAP: Record<HttpMethod, string> = {
  GET: "green",
  POST: "blue",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
};

export const ApiDocDetail: React.FC<ApiDocDetailProps> = ({
  endpoint,
  params,
  onChangeParams,
  body,
  onChangeBody,
  isLoggedIn,
  onOpenLogin,
}) => {
  const { message } = App.useApp();
  const [copiedPath, setCopiedPath] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(endpoint.path);
    setCopiedPath(true);
    message.success("接口路径已复制");
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleParamChange = (paramName: string, value: any) => {
    onChangeParams({
      ...params,
      [paramName]: value,
    });
  };

  const handleBodyTextChange = (text: string) => {
    try {
      if (!text.trim()) {
        onChangeBody(null);
        setJsonError(null);
        return;
      }
      const parsed = JSON.parse(text);
      onChangeBody(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError("JSON 格式错误: " + (e?.message || "语法无效"));
    }
  };

  const handleResetBody = () => {
    if (endpoint.requestBodyExample) {
      onChangeBody(endpoint.requestBodyExample);
      setJsonError(null);
      message.info("已重置请求体为标准样例");
    }
  };

  const hasBody = endpoint.method === "POST" || endpoint.method === "PUT" || endpoint.method === "PATCH";
  const pathAndQueryParams = endpoint.parameters || [];

  return (
    <div style={{ padding: "16px 20px", height: "100%", overflowY: "auto" }}>
      {/* 接口基本元数据头部 */}
      <div style={{ marginBottom: 16 }}>
        <Space size={8} style={{ marginBottom: 6 }} wrap>
          <Tag
            color={METHOD_COLOR_MAP[endpoint.method]}
            style={{ fontSize: 13, fontWeight: 700, padding: "2px 8px" }}
          >
            {endpoint.method}
          </Tag>
          <Text code copyable={false} style={{ fontSize: 14, fontWeight: 600 }}>
            {endpoint.path}
          </Text>
          <Tooltip title="复制完整路径">
            <Button
              type="text"
              size="small"
              icon={copiedPath ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
              onClick={handleCopyPath}
            />
          </Tooltip>
          {endpoint.authRequired ? (
            <Tag icon={<LockOutlined />} color="warning">
              需 JWT 鉴权
            </Tag>
          ) : (
            <Tag icon={<UnlockOutlined />} color="default">
              公开访问
            </Tag>
          )}
          {endpoint.sdkMethod && (
            <Tag color="geekblue" style={{ fontSize: 11 }}>
              SDK: {endpoint.sdkMethod}
            </Tag>
          )}
        </Space>

        <Title level={4} style={{ margin: "4px 0 6px 0" }}>
          {endpoint.name}
        </Title>
        {endpoint.description && (
          <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
            {endpoint.description}
          </Paragraph>
        )}
      </div>

      {/* 鉴权状态提醒 */}
      {endpoint.authRequired && !isLoggedIn && (
        <Alert
          title="当前处于未登录状态"
          description="该接口需要有效的 JWT Bearer Token。在线调试沙箱将无法通过鉴权，建议点击右侧一键登录以自动注入身份凭据。"
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" onClick={onOpenLogin}>
              立即登录
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 请求参数调试表单 (Path & Query) */}
      <Card
        size="small"
        title="📥 请求参数 (Parameters)"
        style={{ marginBottom: 16 }}
        styles={{ header: { fontSize: 13, fontWeight: 600 } }}
      >
        {pathAndQueryParams.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            无 URL Path / Query 传参项
          </Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pathAndQueryParams.map((p) => {
              const currentVal = params[p.name] ?? p.default ?? "";
              return (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "6px 8px",
                    borderRadius: 6,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div style={{ width: 140, flexShrink: 0 }}>
                    <Space size={4}>
                      <Text strong style={{ fontSize: 12 }}>
                        {p.name}
                      </Text>
                      {p.required && <span style={{ color: "#ff4d4f" }}>*</span>}
                    </Space>
                    <div style={{ fontSize: 10, color: "#8c8c8c" }}>
                      <Tag style={{ fontSize: 9, margin: 0, padding: "0 2px", lineHeight: "14px" }}>
                        {p.in}
                      </Tag>{" "}
                      {p.type}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <Input
                      size="small"
                      placeholder={p.description || `输入 ${p.name}`}
                      value={currentVal}
                      onChange={(e) => handleParamChange(p.name, e.target.value)}
                      allowClear
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 请求体 (Request Body) 编辑器 */}
      {hasBody && (
        <Card
          size="small"
          title="📦 请求体 (Request Body JSON)"
          style={{ marginBottom: 16 }}
          styles={{ header: { fontSize: 13, fontWeight: 600 } }}
          extra={
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleResetBody}
              disabled={!endpoint.requestBodyExample}
            >
              重置样例
            </Button>
          }
        >
          <TextArea
            rows={7}
            value={typeof body === "string" ? body : JSON.stringify(body, null, 2)}
            onChange={(e) => handleBodyTextChange(e.target.value)}
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: 12,
              lineHeight: 1.5,
              backgroundColor: "#f5f5f5",
            }}
          />
          {jsonError && (
            <div style={{ color: "#ff4d4f", fontSize: 11, marginTop: 4 }}>
              ⚠️ {jsonError}
            </div>
          )}
        </Card>
      )}

      {/* 契约响应定义 (Response Example) */}
      {endpoint.responseExample && (
        <Card
          size="small"
          title="📄 预期响应模型 (200 OK Response Schema)"
          styles={{ header: { fontSize: 13, fontWeight: 600 } }}
        >
          <pre
            style={{
              margin: 0,
              padding: 10,
              backgroundColor: "#fafafa",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {JSON.stringify(endpoint.responseExample, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};
