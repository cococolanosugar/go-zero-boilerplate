import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, Dropdown, Button, theme } from "antd";
import type { MenuProps } from "antd";
import {
  ReloadOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  DashboardOutlined,
  MoreOutlined,
  VerticalLeftOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useIntl } from "../../contexts/LocaleContext";
import { routes as staticRoutes } from "../../config/routes";
import type { AppRouteItem } from "../../config/routes.types";

export interface TabItem {
  key: string;
  label: string;
  closable: boolean;
}

const HOME_PATH = "/dashboard";
const HOME_TITLE = "概览大盘";
const STORAGE_KEY = "titan_workspace_tabs_history";

export const WorkspaceTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { token } = theme.useToken();

  // 路由路径与标题映射表
  const routeTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (items: AppRouteItem[]) => {
      items.forEach((item) => {
        if (item.path && item.name) {
          const title = formatMessage({
            id: item.locale || item.name,
            defaultMessage: item.name,
          });
          map.set(item.path, title);
        }
        if (item.routes) {
          walk(item.routes);
        }
      });
    };
    const mainRoutes = staticRoutes.find((r) => r.path === "/" && r.layout === true)?.routes || [];
    walk(mainRoutes);
    return map;
  }, [formatMessage]);

  const defaultHomeTitle = routeTitleMap.get(HOME_PATH) || HOME_TITLE;

  // 恢复已打开的页签
  const [tabs, setTabs] = useState<TabItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TabItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasHome = parsed.some((t) => t.key === HOME_PATH);
          if (!hasHome) {
            return [{ key: HOME_PATH, label: defaultHomeTitle, closable: false }, ...parsed];
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [{ key: HOME_PATH, label: defaultHomeTitle, closable: false }];
  });

  // 多语言变动同步
  useEffect(() => {
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        label: t.key === HOME_PATH
          ? (routeTitleMap.get(HOME_PATH) || HOME_TITLE)
          : (routeTitleMap.get(t.key) || t.label),
      }))
    );
  }, [routeTitleMap]);

  // 路由变动时追加页签
  useEffect(() => {
    const currentPath = location.pathname;
    if (!currentPath || currentPath === "/login" || currentPath.startsWith("/exception")) {
      return;
    }

    setTabs((prev) => {
      const exists = prev.some((t) => t.key === currentPath);
      if (exists) {
        return prev;
      }
      const label = routeTitleMap.get(currentPath) || currentPath.split("/").pop() || "页面";
      const next = [
        ...prev,
        {
          key: currentPath,
          label,
          closable: currentPath !== HOME_PATH,
        },
      ];
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [location.pathname, routeTitleMap]);

  // 关闭页签
  const removeTab = useCallback(
    (targetKey: string) => {
      setTabs((prev) => {
        const targetIndex = prev.findIndex((t) => t.key === targetKey);
        const nextTabs = prev.filter((t) => t.key !== targetKey);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextTabs));
        } catch {
          // ignore
        }

        // 若关闭的是当前页，切换到相邻页签
        if (location.pathname === targetKey) {
          if (nextTabs.length > 0) {
            const nextActiveIndex = targetIndex >= nextTabs.length ? nextTabs.length - 1 : targetIndex;
            navigate(nextTabs[nextActiveIndex].key);
          } else {
            navigate(HOME_PATH);
          }
        }
        return nextTabs;
      });
    },
    [location.pathname, navigate]
  );

  // 关闭其他
  const closeOthers = useCallback(
    (targetKey: string) => {
      setTabs((prev) => {
        const nextTabs = prev.filter((t) => t.key === targetKey || !t.closable);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextTabs));
        } catch {
          // ignore
        }
        if (location.pathname !== targetKey) {
          navigate(targetKey);
        }
        return nextTabs;
      });
    },
    [location.pathname, navigate]
  );

  // 关闭右侧
  const closeRight = useCallback(
    (targetKey: string) => {
      setTabs((prev) => {
        const targetIndex = prev.findIndex((t) => t.key === targetKey);
        if (targetIndex === -1) return prev;
        const nextTabs = prev.filter((t, idx) => idx <= targetIndex || !t.closable);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextTabs));
        } catch {
          // ignore
        }
        const currentStillExists = nextTabs.some((t) => t.key === location.pathname);
        if (!currentStillExists) {
          navigate(targetKey);
        }
        return nextTabs;
      });
    },
    [location.pathname, navigate]
  );

  // 全部关闭
  const closeAll = useCallback(() => {
    setTabs((prev) => {
      const nextTabs = prev.filter((t) => !t.closable);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextTabs));
      } catch {
        // ignore
      }
      navigate(HOME_PATH);
      return nextTabs;
    });
  }, [navigate]);

  // 刷新当前页面
  const refreshCurrent = useCallback(() => {
    navigate(0);
  }, [navigate]);

  const getContextMenuItems = (key: string): MenuProps["items"] => {
    const isHome = key === HOME_PATH;
    const isCurrent = location.pathname === key;
    const currentIndex = tabs.findIndex((t) => t.key === key);
    const hasRight = currentIndex !== -1 && currentIndex < tabs.length - 1;

    return [
      {
        key: "refresh",
        icon: <ReloadOutlined />,
        label: "刷新当前页",
        disabled: !isCurrent,
        onClick: refreshCurrent,
      },
      {
        key: "close",
        icon: <CloseCircleOutlined />,
        label: "关闭标签页",
        disabled: isHome,
        onClick: () => removeTab(key),
      },
      {
        key: "closeOthers",
        icon: <MinusCircleOutlined />,
        label: "关闭其他标签",
        disabled: tabs.length <= 2 && isHome,
        onClick: () => closeOthers(key),
      },
      {
        key: "closeRight",
        icon: <VerticalLeftOutlined />,
        label: "关闭右侧标签",
        disabled: !hasRight,
        onClick: () => closeRight(key),
      },
      {
        type: "divider",
      },
      {
        key: "closeAll",
        icon: <CloseCircleOutlined />,
        danger: true,
        label: "全部关闭",
        disabled: tabs.length <= 1,
        onClick: closeAll,
      },
    ];
  };

  const tabItems = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.key,
        closable: tab.closable,
        label: (
          <Dropdown menu={{ items: getContextMenuItems(tab.key) }} trigger={["contextMenu"]}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, userSelect: "none" }}>
              {tab.key === HOME_PATH && <DashboardOutlined style={{ fontSize: 12 }} />}
              <span>{tab.label}</span>
            </span>
          </Dropdown>
        ),
      })),
    [tabs, getContextMenuItems]
  );

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 38,
        lineHeight: "38px",
        zIndex: 10,
        position: "sticky",
        top: 48,
      }}
    >
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Tabs
          activeKey={location.pathname}
          type="editable-card"
          hideAdd
          size="small"
          items={tabItems}
          onChange={(key) => navigate(key)}
          onEdit={(targetKey, action) => {
            if (action === "remove" && typeof targetKey === "string") {
              removeTab(targetKey);
            }
          }}
          tabBarStyle={{
            margin: 0,
            borderBottom: "none",
            height: 38,
          }}
        />
      </div>

      <div style={{ marginLeft: 8 }}>
        <Dropdown
          menu={{
            items: [
              {
                key: "refresh",
                icon: <ReloadOutlined />,
                label: "刷新当前页",
                onClick: refreshCurrent,
              },
              {
                key: "closeOthers",
                icon: <MinusCircleOutlined />,
                label: "关闭其他标签",
                onClick: () => closeOthers(location.pathname),
              },
              {
                key: "closeAll",
                icon: <CloseCircleOutlined />,
                danger: true,
                label: "全部关闭",
                onClick: closeAll,
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      </div>
    </div>
  );
};

export default WorkspaceTabs;
