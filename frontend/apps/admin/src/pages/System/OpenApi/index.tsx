import React, { useEffect, useState, useMemo } from "react";
import {
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Descriptions,
  Badge,
  Flex,
  Card,
  Divider,
} from "antd";
import {
  PageContainer,
  ProCard,
  ProTable,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  ApiOutlined,
  SearchOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { Text, Paragraph, Title } = Typography;

interface SwaggerEndpoint {
  method: string;
  path: string;
  summary: string;
  operationId: string;
  parameters: any[];
  responses: any;
  tag: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
};

export const OpenApiPage: React.FC = () => {
  const [swaggerData, setSwaggerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/openapi.json")
      .then((res) => res.json())
      .then((data) => {
        setSwaggerData(data);
      })
      .catch((err) => {
        console.error("加载 OpenAPI 规范失败:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const endpoints = useMemo<SwaggerEndpoint[]>(() => {
    if (!swaggerData?.paths) return [];
    const list: SwaggerEndpoint[] = [];
    Object.entries(swaggerData.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, op]: [string, any]) => {
        const upperMethod = method.toUpperCase();
        let tag = "通用微服务接口";
        if (path.startsWith("/api/v1/system/auth")) tag = "认证鉴权 (Auth)";
        else if (path.startsWith("/api/v1/system/users")) tag = "员工治理 (Users)";
        else if (path.startsWith("/api/v1/system/roles")) tag = "角色分配 (Roles)";
        else if (path.startsWith("/api/v1/system/menus")) tag = "菜单路由 (Menus)";
        else if (path.startsWith("/api/v1/system/apis")) tag = "接口字典 (Apis)";
        else if (path.startsWith("/api/v1/system/dicts")) tag = "数据字典 (Dicts)";
        else if (path.startsWith("/api/v1/system/logs")) tag = "审计日志 (Logs)";
        else if (path.startsWith("/api/v1/order")) tag = "订单事务 (Orders)";
        else if (path.startsWith("/api/v1/user")) tag = "用户中心 (User)";

        list.push({
          method: upperMethod,
          path,
          summary: op.summary || "无描述",
          operationId: op.operationId || "",
          parameters: op.parameters || [],
          responses: op.responses || {},
          tag,
        });
      });
    });
    return list;
  }, [swaggerData]);

  const filteredEndpoints = useMemo(() => {
    if (!search.trim()) return endpoints;
    const q = search.trim().toLowerCase();
    return endpoints.filter(
      (item) =>
        item.path.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
    );
  }, [endpoints, search]);

  const columns: ProColumns<SwaggerEndpoint>[] = [
    {
      title: "请求方式",
      dataIndex: "method",
      width: 100,
      render: (_, r) => <Tag color={METHOD_COLORS[r.method] || "default"}>{r.method}</Tag>,
    },
    {
      title: "接口路径",
      dataIndex: "path",
      copyable: true,
      render: (_, r) => <Text code>{r.path}</Text>,
    },
    {
      title: "功能摘要",
      dataIndex: "summary",
    },
    {
      title: "业务领域",
      dataIndex: "tag",
      render: (_, r) => <Tag>{r.tag}</Tag>,
    },
    {
      title: "参数个数",
      dataIndex: "parameters",
      render: (_, r) => (
        <span>{r.parameters?.length ? `${r.parameters.length} 个参数` : "无入参"}</span>
      ),
    },
  ];

  return (
    <PageContainer
      title="OpenAPI / Swagger 接口契约中心"
      subTitle="由 goctl api swagger 自动逆向网关 IDL 生成，保证前后端强类型契约绝对一致"
      extra={[
        <Button
          key="json"
          icon={<ExportOutlined />}
          onClick={() => window.open("/openapi.json", "_blank")}
        >
          查看原始规范 (JSON)
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() => {
            const blob = new Blob([JSON.stringify(swaggerData, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "gateway_openapi.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          导出 OpenAPI 规范文件
        </Button>,
      ]}
    >
      <Flex vertical gap={16} style={{ width: "100%" }}>
        {/* 顶部指标 */}
        <ProCard gutter={16} ghost>
          <ProCard title="OpenAPI 规范版本" bordered colSpan={{ xs: 24, sm: 8 }}>
            <Text strong style={{ fontSize: 20, color: "#1677ff" }}>
              {swaggerData?.openapi ? `OpenAPI ${swaggerData.openapi}` : "OpenAPI"}
            </Text>
          </ProCard>
          <ProCard title="网关基础路由前缀" bordered colSpan={{ xs: 24, sm: 8 }}>
            <Text strong style={{ fontSize: 20, color: "#52c41a" }}>
              {swaggerData?.basePath || "/"}
            </Text>
          </ProCard>
          <ProCard title="已索引接口总量" bordered colSpan={{ xs: 24, sm: 8 }}>
            <Text strong style={{ fontSize: 20, color: "#722ed1" }}>
              {endpoints.length} 个端点
            </Text>
          </ProCard>
        </ProCard>

        {/* 接口搜索与表格 */}
        <ProCard title="接口契约清单" headerBordered>
          <div style={{ marginBottom: 16 }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="按接口路径、摘要、请求方式或业务领域检索..."
              prefix={<SearchOutlined style={{ color: "#1677ff" }} />}
              allowClear
              style={{ maxWidth: 460 }}
            />
          </div>

          <ProTable<SwaggerEndpoint>
            columns={columns}
            dataSource={filteredEndpoints}
            loading={loading}
            rowKey={(r) => `${r.method}-${r.path}`}
            search={false}
            options={false}
            pagination={{
              pageSize: 15,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: "8px 16px", background: "#fafafa", borderRadius: 6 }}>
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Operation ID">{record.operationId}</Descriptions.Item>
                    <Descriptions.Item label="响应状态码">
                      {Object.keys(record.responses || {}).map((code) => (
                        <Tag key={code} color="green">{code}</Tag>
                      ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="入参详情" span={2}>
                      {record.parameters && record.parameters.length > 0 ? (
                        <Flex vertical gap={4} style={{ marginTop: 4 }}>
                          {record.parameters.map((p, idx) => (
                            <Text key={idx} code>
                              [{p.in}] {p.name} ({p.type || "object"}) {p.required ? "(必填)" : "(选填)"}
                            </Text>
                          ))}
                        </Flex>
                      ) : (
                        <Text type="secondary">无入参要求</Text>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            }}
          />
        </ProCard>
      </Flex>
    </PageContainer>
  );
};

export default OpenApiPage;
