import React, { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Input, Tag, Typography } from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  BulbOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  RightOutlined,
  FormOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
  ApiOutlined,
  BookOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { setToken } from "@zero/api";
import { useLayoutSettings } from "../../contexts/LayoutSettingsContext";
import { useIntl } from "../../contexts/LocaleContext";
import { useAuth } from "../../contexts/AuthContext";
import { getAccess } from "../../access";
import { routes as staticRoutes } from "../../config/routes";
import type { AppRouteItem } from "../../config/routes.types";
import zhCN from "../../locales/zh-CN";

const { Text } = Typography;

export interface CommandItem {
  key: string;
  title: string;
  category: "页面导航" | "全局动作";
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

const getRouteIcon = (iconName?: string | React.ReactNode) => {
  if (React.isValidElement(iconName)) return iconName;
  switch (iconName) {
    case "DashboardOutlined":
      return <DashboardOutlined />;
    case "AppstoreOutlined":
      return <AppstoreOutlined />;
    case "FormOutlined":
      return <FormOutlined />;
    case "ProfileOutlined":
      return <ProfileOutlined />;
    case "CheckCircleOutlined":
      return <CheckCircleOutlined />;
    case "ShoppingCartOutlined":
      return <ShoppingCartOutlined />;
    case "UserOutlined":
      return <UserOutlined />;
    case "SettingOutlined":
      return <SettingOutlined />;
    case "SafetyCertificateOutlined":
      return <SafetyCertificateOutlined />;
    case "MenuOutlined":
      return <MenuOutlined />;
    case "ApiOutlined":
      return <ApiOutlined />;
    case "BookOutlined":
      return <BookOutlined />;
    case "HistoryOutlined":
      return <HistoryOutlined />;
    default:
      return <AppstoreOutlined />;
  }
};

export const CommandPalette: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ open: externalOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<any>(null);
  const navigate = useNavigate();
  const { toggleNavTheme, isDark } = useLayoutSettings();
  const { formatMessage } = useIntl();
  const { profile } = useAuth();
  const accessInstance = getAccess(profile);

  const handleLogout = () => {
    setToken(null);
    navigate("/login", { replace: true });
  };

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  // 监听全局 Ctrl+K 或 Cmd+K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const allCommands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // 递归遍历路由配置提取所有可访问的业务页面
    const walkRoutes = (items: AppRouteItem[]) => {
      items.forEach((item) => {
        if (
          item.path &&
          item.name &&
          !item.redirect &&
          item.path !== "/login" &&
          !item.path.startsWith("/40") &&
          !item.path.startsWith("/50")
        ) {
          // 具备权限校验，当存在 profile 时判定细粒度权限
          if (!item.access || !profile || accessInstance.canAccess(item.access)) {
            const localeKey = item.locale || item.name;
            const fallbackChinese = (zhCN as Record<string, string>)[localeKey] || item.name;
            const translated = formatMessage({
              id: localeKey,
              defaultMessage: fallbackChinese,
            });
            const displayName =
              translated === localeKey && fallbackChinese ? fallbackChinese : translated;

            list.push({
              key: `nav-${item.path}`,
              title: `${displayName} (${item.path})`,
              category: "页面导航",
              icon: getRouteIcon(item.icon),
              action: () => navigate(item.path),
              keywords: [
                item.path.replace(/\//g, " ").trim(),
                displayName,
                localeKey,
                item.name,
              ],
            });
          }
        }

        if (item.routes && item.routes.length > 0) {
          walkRoutes(item.routes);
        }
      });
    };

    const mainRoutes =
      staticRoutes.find((r) => r.path === "/" && r.layout === true)?.routes || [];
    walkRoutes(mainRoutes);

    // 全局快捷动作
    const globalActions: CommandItem[] = [
      {
        key: "toggle-theme",
        title: isDark ? "切换为浅色主题" : "切换为暗黑模式",
        category: "全局动作",
        icon: <BulbOutlined />,
        action: () => toggleNavTheme(),
        keywords: ["theme", "dark", "light", "zhuti"],
      },
      {
        key: "toggle-fullscreen",
        title: "全屏切换",
        category: "全局动作",
        icon: <FullscreenOutlined />,
        action: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        },
        keywords: ["fullscreen", "quanping"],
      },
      {
        key: "logout",
        title: "退出系统登录",
        category: "全局动作",
        icon: <LogoutOutlined />,
        action: () => handleLogout(),
        keywords: ["logout", "tuichu"],
      },
    ];

    return [...list, ...globalActions];
  }, [navigate, isDark, toggleNavTheme, formatMessage, profile]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return allCommands;
    const q = search.trim().toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [allCommands, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (cmd: CommandItem) => {
    setOpen(false);
    setSearch("");
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => setOpen(false)}
      footer={null}
      closable={false}
      styles={{
        body: { padding: 0 },
      }}
      width={600}
      style={{ top: 120 }}
    >
      <div style={{ padding: "16px 16px 8px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <Input
          ref={inputRef}
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          prefix={<SearchOutlined style={{ color: "#1677ff", fontSize: 18, marginRight: 8 }} />}
          suffix={<Tag color="blue">Ctrl + K</Tag>}
          placeholder="输入页面名称、关键词或快捷动作进行模糊检索..."
          variant="borderless"
          style={{ fontSize: 16 }}
        />
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
        {filteredCommands.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8c8c8c" }}>
            未找到匹配的页面或指令
          </div>
        ) : (
          filteredCommands.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.key}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: "10px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "rgba(22, 119, 255, 0.08)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 16, color: isSelected ? "#1677ff" : "#595959" }}>
                    {item.icon}
                  </span>
                  <Text strong={isSelected} style={{ fontSize: 14 }}>
                    {item.title}
                  </Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag>{item.category}</Tag>
                  {isSelected && <RightOutlined style={{ fontSize: 12, color: "#1677ff" }} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#8c8c8c",
        }}
      >
        <span>
          使用 <Tag>↑</Tag> <Tag>↓</Tag> 导航，<Tag>Enter</Tag> 执行
        </span>
        <span>
          <Tag>ESC</Tag> 关闭
        </span>
      </div>
    </Modal>
  );
};

export default CommandPalette;
