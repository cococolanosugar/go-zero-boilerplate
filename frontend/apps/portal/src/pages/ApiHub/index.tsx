import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Grid,
  Typography,
  Spin,
  Tabs,
  Button,
  Tag,
  Space,
  theme,
  Empty,
  Badge,
} from "antd";
import {
  ApiOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useOutletContext } from "react-router-dom";
import { getToken } from "@zero/api";
import { useAuth } from "../../contexts/AuthContext";
import type { ApiCategoryVO, ApiEndpointVO, SandboxResult } from "./types";
import { loadApiCategories, findEndpointById } from "./parser";
import { executeSandboxRequest } from "./sandboxRunner";
import { ApiTree } from "./components/ApiTree";
import { ApiDocDetail } from "./components/ApiDocDetail";
import { ApiConsole } from "./components/ApiConsole";

const { Title, Text } = Typography;

export const ApiHubPage: React.FC = () => {
  const { token: themeToken } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.lg ?? true;

  const outletCtx = useOutletContext<{ onOpenLogin?: () => void }>();
  const onOpenLogin = outletCtx?.onOpenLogin;
  const { isLoggedIn } = useAuth();

  const [categories, setCategories] = useState<ApiCategoryVO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointVO | null>(null);

  // Parameter and body states for current endpoint
  const [params, setParams] = useState<Record<string, any>>({});
  const [body, setBody] = useState<any>("");
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);

  // Mobile active tab: tree | doc | console
  const [mobileTab, setMobileTab] = useState<string>("tree");

  // Load API Catalog
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { categories: cats, isLive: live } = await loadApiCategories();
      setCategories(cats);
      setIsLive(live);

      // Select first available endpoint if none selected
      if (cats.length > 0 && cats[0].endpoints.length > 0) {
        setSelectedEndpoint((prev) => {
          if (prev && findEndpointById(cats, prev.id)) {
            return findEndpointById(cats, prev.id)!;
          }
          return cats[0].endpoints[0];
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When active endpoint switches, initialize default params & body
  const handleSelectEndpoint = useCallback(
    (ep: ApiEndpointVO) => {
      setSelectedEndpoint(ep);

      const initParams: Record<string, any> = {};
      if (ep.parameters) {
        ep.parameters.forEach((p) => {
          if (p.example !== undefined) {
            initParams[p.name] = p.example;
          } else if (p.type === "integer" || p.type === "number") {
            initParams[p.name] = 1;
          } else {
            initParams[p.name] = "";
          }
        });
      }
      setParams(initParams);

      if (ep.requestBodyExample) {
        setBody(ep.requestBodyExample);
      } else {
        setBody("");
      }

      setSandboxResult(null);

      if (!isDesktop) {
        setMobileTab("doc");
      }
    },
    [isDesktop]
  );

  // Headers for current state
  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { Accept: "application/json" };
    const jwt = getToken();
    if (jwt) {
      h["Authorization"] = `Bearer ${jwt}`;
    }
    return h;
  }, []);

  // Handle Sandbox Execution
  const handleExecuteSandbox = useCallback(async () => {
    if (!selectedEndpoint) return;
    setExecuting(true);
    try {
      const jwtToken = getToken() || undefined;
      const result = await executeSandboxRequest({
        endpoint: selectedEndpoint,
        params,
        body,
        token: jwtToken,
      });
      setSandboxResult(result);
      if (!isDesktop) {
        setMobileTab("console");
      }
    } finally {
      setExecuting(false);
    }
  }, [selectedEndpoint, params, body, isDesktop]);

  return (
    <div
      style={{
        maxWidth: 1680,
        margin: "0 auto",
        padding: isDesktop ? "24px 28px" : "16px 12px",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
          padding: "18px 24px",
          background: themeToken.colorBgContainer,
          borderRadius: themeToken.borderRadiusLG,
          border: `1px solid ${themeToken.colorBorderSecondary}`,
          boxShadow: themeToken.boxShadowTertiary,
        }}
      >
        <div>
          <Space align="center" size={10}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: themeToken.colorPrimaryBg,
                color: themeToken.colorPrimary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              <ApiOutlined />
            </div>
            <div>
              <Space align="center" size={8}>
                <Title level={4} style={{ margin: 0 }}>
                  API 契约集市与交互沙箱
                </Title>
                <Tag color="blue" style={{ borderRadius: 10 }}>
                  Stripe-like 3-Column
                </Tag>
              </Space>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  基于 go-zero IDL 契约与 OpenAPI 3.0 标准驱动 · 实时多语言代码生成 · 零等待真实沙箱调用
                </Text>
              </div>
            </div>
          </Space>
        </div>

        <Space orientation="horizontal" size={12} wrap>
          {isLive ? (
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{ padding: "4px 10px", fontSize: 13 }}
            >
              网关服务在线 (:8888)
            </Tag>
          ) : (
            <Tag
              icon={<CloudServerOutlined />}
              color="default"
              style={{ padding: "4px 10px", fontSize: 13 }}
            >
              内置离线契约 (高可用)
            </Tag>
          )}

          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchData}
            loading={loading}
          >
            刷新契约
          </Button>
        </Space>
      </div>

      {loading && categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" description="正在加载微服务 API 契约与元数据..." />
        </div>
      ) : categories.length === 0 ? (
        <Empty description="暂无可用 API 契约" />
      ) : isDesktop ? (
        /* =================== Desktop 3-Column Layout =================== */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px minmax(380px, 1fr) minmax(420px, 1.1fr)",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {/* Left Column: API Directory Tree */}
          <div
            style={{
              background: themeToken.colorBgContainer,
              borderRadius: themeToken.borderRadiusLG,
              border: `1px solid ${themeToken.colorBorderSecondary}`,
              padding: 0,
              height: "calc(100vh - 210px)",
              minHeight: 650,
              overflowY: "auto",
              boxShadow: themeToken.boxShadowTertiary,
            }}
          >
            <ApiTree
              categories={categories}
              selectedEndpointId={selectedEndpoint?.id}
              onSelectEndpoint={handleSelectEndpoint}
              isLive={isLive}
            />
          </div>

          {/* Middle Column: Contract Details & Parameter Form */}
          <div
            style={{
              background: themeToken.colorBgContainer,
              borderRadius: themeToken.borderRadiusLG,
              border: `1px solid ${themeToken.colorBorderSecondary}`,
              padding: 20,
              height: "calc(100vh - 210px)",
              minHeight: 650,
              overflowY: "auto",
              boxShadow: themeToken.boxShadowTertiary,
            }}
          >
            {selectedEndpoint ? (
              <ApiDocDetail
                endpoint={selectedEndpoint}
                params={params}
                onChangeParams={setParams}
                body={body}
                onChangeBody={setBody}
                isLoggedIn={isLoggedIn}
                onOpenLogin={onOpenLogin}
              />
            ) : (
              <Empty description="请从左侧选择需要查看的 API 接口" />
            )}
          </div>

          {/* Right Column: Code Snippets & Sandbox Console */}
          <div
            style={{
              background: themeToken.colorBgContainer,
              borderRadius: themeToken.borderRadiusLG,
              border: `1px solid ${themeToken.colorBorderSecondary}`,
              padding: 20,
              height: "calc(100vh - 210px)",
              minHeight: 650,
              overflowY: "auto",
              boxShadow: themeToken.boxShadowTertiary,
            }}
          >
            {selectedEndpoint ? (
              <ApiConsole
                endpoint={selectedEndpoint}
                params={params}
                body={body}
                headers={headers}
                sandboxResult={sandboxResult}
                onExecuteSandbox={handleExecuteSandbox}
                executing={executing}
                isLoggedIn={isLoggedIn}
                onOpenLogin={onOpenLogin}
              />
            ) : (
              <Empty description="选择接口后即可生成代码并联调沙箱" />
            )}
          </div>
        </div>
      ) : (
        /* =================== Mobile / Tablet Tab Layout =================== */
        <div
          style={{
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadiusLG,
            border: `1px solid ${themeToken.colorBorderSecondary}`,
            padding: 16,
            minHeight: 550,
            boxShadow: themeToken.boxShadowTertiary,
          }}
        >
          <Tabs
            activeKey={mobileTab}
            onChange={setMobileTab}
            type="card"
            items={[
              {
                key: "tree",
                label: (
                  <span>
                    <BookOutlined /> API 目录
                  </span>
                ),
                children: (
                  <div style={{ maxHeight: 600, overflowY: "auto", paddingTop: 8 }}>
                    <ApiTree
                      categories={categories}
                      selectedEndpointId={selectedEndpoint?.id}
                      onSelectEndpoint={handleSelectEndpoint}
                      isLive={isLive}
                    />
                  </div>
                ),
              },
              {
                key: "doc",
                label: (
                  <span>
                    <CodeOutlined /> 契约与表单
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={() => setMobileTab("console")}
                      >
                        前往调试控制台
                      </Button>
                    </div>
                    {selectedEndpoint ? (
                      <ApiDocDetail
                        endpoint={selectedEndpoint}
                        params={params}
                        onChangeParams={setParams}
                        body={body}
                        onChangeBody={setBody}
                        isLoggedIn={isLoggedIn}
                        onOpenLogin={onOpenLogin}
                      />
                    ) : (
                      <Empty description="请先选择接口" />
                    )}
                  </div>
                ),
              },
              {
                key: "console",
                label: (
                  <span>
                    <Badge dot={!!sandboxResult}>
                      <ThunderboltOutlined /> 代码与沙箱
                    </Badge>
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 8 }}>
                    {selectedEndpoint ? (
                      <ApiConsole
                        endpoint={selectedEndpoint}
                        params={params}
                        body={body}
                        headers={headers}
                        sandboxResult={sandboxResult}
                        onExecuteSandbox={handleExecuteSandbox}
                        executing={executing}
                        isLoggedIn={isLoggedIn}
                        onOpenLogin={onOpenLogin}
                      />
                    ) : (
                      <Empty description="请先选择接口" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default ApiHubPage;
