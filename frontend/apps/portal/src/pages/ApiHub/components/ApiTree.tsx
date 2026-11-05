import React, { useState, useMemo } from "react";
import { Input, Tag, Space, Badge, Typography, Segmented, Tooltip, Empty } from "antd";
import {
  SearchOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import type { ApiCategoryVO, ApiEndpointVO, HttpMethod } from "../types";
import { filterCategories } from "../parser";

const { Text } = Typography;

interface ApiTreeProps {
  categories: ApiCategoryVO[];
  selectedEndpointId?: string;
  onSelectEndpoint: (endpoint: ApiEndpointVO) => void;
  isLive?: boolean;
}

const METHOD_COLOR_MAP: Record<HttpMethod, string> = {
  GET: "green",
  POST: "blue",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
};

export const ApiTree: React.FC<ApiTreeProps> = ({
  categories,
  selectedEndpointId,
  onSelectEndpoint,
  isLive = false,
}) => {
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return filterCategories(categories, keyword, methodFilter);
  }, [categories, keyword, methodFilter]);

  const totalEndpoints = useMemo(() => {
    return filtered.reduce((acc, cat) => acc + cat.endpoints.length, 0);
  }, [filtered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px 14px" }}>
      {/* 状态与契约源指示器 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Space size={6}>
          <FolderOpenOutlined style={{ color: "#1890ff" }} />
          <Text strong style={{ fontSize: 13 }}>
            接口目录 ({totalEndpoints})
          </Text>
        </Space>
        <Tooltip title={isLive ? "已成功连接统一网关实时 OpenAPI" : "网关未连通，已自动加载离线内置契约字典"}>
          <Tag color={isLive ? "success" : "default"} style={{ margin: 0, fontSize: 11 }}>
            {isLive ? <CheckCircleOutlined /> : <CloudSyncOutlined />}
            <span style={{ marginLeft: 4 }}>{isLive ? "动态契约" : "离线字典"}</span>
          </Tag>
        </Tooltip>
      </div>

      {/* 搜索与 Method 分段器 */}
      <div style={{ marginBottom: 10 }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="搜索接口名称、路径、标签..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          size="small"
          style={{ marginBottom: 8 }}
        />
        <Segmented
          size="small"
          value={methodFilter}
          onChange={(val) => setMethodFilter(val as string)}
          options={["ALL", "GET", "POST", "PUT", "DELETE"]}
          block
        />
      </div>

      {/* 接口分组列表容器 */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {filtered.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未匹配到接口" style={{ padding: "24px 0" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((cat) => (
              <div key={cat.key}>
                {/* 模块标题 */}
                <div
                  style={{
                    fontSize: 12,
                    color: "#8c8c8c",
                    fontWeight: 600,
                    marginBottom: 6,
                    paddingLeft: 4,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{cat.title}</span>
                  <span style={{ opacity: 0.75 }}>({cat.endpoints.length})</span>
                </div>

                {/* 接口列表 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {cat.endpoints.map((ep) => {
                    const isSelected = ep.id === selectedEndpointId;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => onSelectEndpoint(ep)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          cursor: "pointer",
                          backgroundColor: isSelected ? "rgba(24, 144, 255, 0.12)" : "transparent",
                          border: isSelected ? "1px solid #91d5ff" : "1px solid transparent",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Space size={6} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <Tag
                              color={METHOD_COLOR_MAP[ep.method] || "default"}
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                margin: 0,
                                padding: "0 4px",
                                lineHeight: "16px",
                              }}
                            >
                              {ep.method}
                            </Tag>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? "#1890ff" : "inherit",
                              }}
                            >
                              {ep.name}
                            </span>
                          </Space>
                          {ep.authRequired && (
                            <Tooltip title="需 Bearer Token 身份认证">
                              <LockOutlined style={{ fontSize: 11, color: "#faad14" }} />
                            </Tooltip>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#8c8c8c",
                            marginTop: 2,
                            paddingLeft: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "monospace",
                          }}
                        >
                          {ep.path}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
