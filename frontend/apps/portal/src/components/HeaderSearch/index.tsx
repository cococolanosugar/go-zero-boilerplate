import React, { useState, useRef, useEffect, useMemo } from "react";
import { AutoComplete, Input, Space, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useIntl } from "../../contexts/LocaleContext";
import { routes as staticRoutes } from "../../config/routes";
import type { AppRouteItem } from "../../config/routes.types";

const { Text } = Typography;

interface SearchRouteOption {
  value: string; // target path
  title: string;
  path: string;
}

export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<any>(null);

  // 扁平化收集所有有效且已授权的页面路由
  const allRoutes = useMemo(() => {
    const list: SearchRouteOption[] = [];

    const walk = (items: AppRouteItem[]) => {
      items.forEach((item) => {
        // 过滤不可访问页面
        if (item.access && !hasPermission(item.access)) {
          return;
        }
        if (item.path && item.component && !item.hideInMenu && !item.redirect) {
          const title = item.name
            ? formatMessage({ id: item.locale || item.name, defaultMessage: item.name })
            : item.path;
          list.push({
            value: item.path,
            title,
            path: item.path,
          });
        }
        if (item.routes && item.routes.length > 0) {
          walk(item.routes);
        }
      });
    };

    const mainRoutes = staticRoutes.find((r) => r.path === "/" && r.layout === true)?.routes || [];
    walk(mainRoutes);
    return list;
  }, [hasPermission, formatMessage]);

  // 全局快捷键 Cmd + K / Ctrl + K 侦听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 构建下拉候选项
  const options = useMemo(() => {
    if (!searchValue) {
      return allRoutes.slice(0, 8).map((r) => ({
        value: r.value,
        label: (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
            <Space>
              <SearchOutlined style={{ color: "#8c8c8c" }} />
              <Text strong>{r.title}</Text>
            </Space>
            <Tag color="purple" style={{ marginRight: 0 }}>
              {r.path}
            </Tag>
          </div>
        ),
      }));
    }

    const kw = searchValue.toLowerCase();
    return allRoutes
      .filter((r) => r.title.toLowerCase().includes(kw) || r.path.toLowerCase().includes(kw))
      .map((r) => ({
        value: r.value,
        label: (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
            <Space>
              <SearchOutlined style={{ color: "#722ed1" }} />
              <Text strong>{r.title}</Text>
            </Space>
            <Tag color="purple" style={{ marginRight: 0 }}>
              {r.path}
            </Tag>
          </div>
        ),
      }));
  }, [allRoutes, searchValue]);

  const isMac = typeof window !== "undefined" && /macintosh|mac os x/i.test(navigator.userAgent);
  const shortcutLabel = isMac ? "⌘ K" : "Ctrl+K";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        marginRight: 12,
      }}
    >
      <AutoComplete
        open={open}
        onOpenChange={setOpen}
        options={options}
        style={{ width: open ? 260 : 200, transition: "width 0.3s ease" }}
        onSelect={(value: string) => {
          navigate(value);
          setSearchValue("");
          setOpen(false);
          inputRef.current?.blur();
        }}
        value={searchValue}
        onChange={setSearchValue}
      >
        <Input
          ref={inputRef}
          prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
          suffix={
            <Tag
              style={{
                margin: 0,
                padding: "0 4px",
                fontSize: 11,
                lineHeight: "18px",
                color: "#8c8c8c",
                backgroundColor: "#f5f5f5",
                border: "1px solid #d9d9d9",
                borderRadius: 3,
                cursor: "pointer",
              }}
              onClick={() => {
                setOpen(true);
                inputRef.current?.focus();
              }}
            >
              {shortcutLabel}
            </Tag>
          }
          placeholder={formatMessage({ id: "portal.header.search", defaultMessage: "全站快捷搜索..." })}
          onFocus={() => setOpen(true)}
          allowClear
        />
      </AutoComplete>
    </div>
  );
};

export default HeaderSearch;