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
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { setToken } from "@zero/api";
import { useLayoutSettings } from "../../contexts/LayoutSettingsContext";

const { Text } = Typography;

export interface CommandItem {
  key: string;
  title: string;
  category: "页面导航" | "全局动作";
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

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

  const allCommands: CommandItem[] = useMemo(
    () => [
      {
        key: "workplace",
        title: "工作台 (Workplace)",
        category: "页面导航",
        icon: <AppstoreOutlined />,
        action: () => navigate("/workplace"),
        keywords: ["workplace", "gongzuotai", "home"],
      },
      {
        key: "dashboard",
        title: "监控大盘 (Dashboard)",
        category: "页面导航",
        icon: <DashboardOutlined />,
        action: () => navigate("/dashboard"),
        keywords: ["dashboard", "dapan", "monitor"],
      },
      {
        key: "orders",
        title: "订单管理 (Orders)",
        category: "页面导航",
        icon: <ShoppingCartOutlined />,
        action: () => navigate("/orders"),
        keywords: ["orders", "dingdan"],
      },
      {
        key: "step-form",
        title: "分步向导表单 (StepsForm)",
        category: "页面导航",
        icon: <FormOutlined />,
        action: () => navigate("/form/step-form"),
        keywords: ["step", "form", "xiangdao", "zhuanzhang"],
      },
      {
        key: "profile-advanced",
        title: "高级详情页 (Advanced Profile)",
        category: "页面导航",
        icon: <ProfileOutlined />,
        action: () => navigate("/profile/advanced"),
        keywords: ["profile", "xiangqing", "advanced"],
      },
      {
        key: "system-users",
        title: "员工管理 (Users)",
        category: "页面导航",
        icon: <UserOutlined />,
        action: () => navigate("/system/users"),
        keywords: ["users", "yuangong"],
      },
      {
        key: "system-roles",
        title: "角色管理 (Roles)",
        category: "页面导航",
        icon: <SettingOutlined />,
        action: () => navigate("/system/roles"),
        keywords: ["roles", "juese"],
      },
      {
        key: "system-logs",
        title: "审计日志 (Logs)",
        category: "页面导航",
        icon: <SettingOutlined />,
        action: () => navigate("/system/logs"),
        keywords: ["logs", "shenji", "rizhi"],
      },
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
    ],
    [navigate, isDark, toggleNavTheme]
  );

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
