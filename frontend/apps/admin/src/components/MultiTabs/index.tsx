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
import { TABS_CONFIG, STORAGE_KEYS } from "../../constants";
import { sessionStore } from "../../utils/storage";

export interface TabItem {
  key: string;
  label: string;
  closable: boolean;
}

export const MultiTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { token } = theme.useToken();

  // 路由路径与标题/国际化映射表
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

  // 默认首页 Tab 永久固定
  const defaultDashboardTitle = routeTitleMap.get(TABS_CONFIG.HOME_PATH) || TABS_CONFIG.HOME_TITLE;

  // 优先从 sessionStore 恢复已打开的 Tab 列表，保障 F5 刷新不丢失标签上下文
  const [tabs, setTabs] = useState<TabItem[]>(() => {
    const cached = sessionStore.get<TabItem[]>(STORAGE_KEYS.TABS_HISTORY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      const hasHome = cached.some((t) => t.key === TABS_CONFIG.HOME_PATH);
      if (!hasHome) {
        return [
          {
            key: TABS_CONFIG.HOME_PATH,
            label: defaultDashboardTitle,
            closable: false,
          },
          ...cached,
        ];
      }
      return cached;
    }
    return [
      {
        key: TABS_CONFIG.HOME_PATH,
        label: defaultDashboardTitle,
        closable: false,
      },
    ];
  });

  // 当语言切换或路由映射表更新时，联动同步更新各 Tab 的多语言标题
  useEffect(() => {
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        label: t.key === TABS_CONFIG.HOME_PATH
          ? (routeTitleMap.get(TABS_CONFIG.HOME_PATH) || TABS_CONFIG.HOME_TITLE)
          : (routeTitleMap.get(t.key) || t.label),
      }))
    );
  }, [routeTitleMap]);

  // 路由变动时动态追加 Tab
  useEffect(() => {
    const currentPath = location.pathname;
    if (!currentPath || currentPath === "/login" || currentPath === "/403" || currentPath === "/404" || currentPath === "/500") {
      return;
    }

    setTabs((prev) => {
      const exists = prev.some((t) => t.key === currentPath);
      if (exists) {
        return prev;
      }
      const title = routeTitleMap.get(currentPath) || currentPath;
      const nextTabs = [
        ...prev,
        {
          key: currentPath,
          label: title,
          closable: currentPath !== TABS_CONFIG.HOME_PATH,
        },
      ];
      // 控制最大标签数，防止溢出
      if (nextTabs.length > TABS_CONFIG.MAX_OPEN_TABS) {
        const homeTab = nextTabs.find((t) => t.key === TABS_CONFIG.HOME_PATH)!;
        const otherTabs = nextTabs.filter((t) => t.key !== TABS_CONFIG.HOME_PATH);
        return [homeTab, ...otherTabs.slice(-(TABS_CONFIG.MAX_OPEN_TABS - 1))];
      }
      return nextTabs;
    });
  }, [location.pathname, routeTitleMap]);

  // 状态变动时自动持久化到 sessionStore
  useEffect(() => {
    sessionStore.set(STORAGE_KEYS.TABS_HISTORY, tabs);
  }, [tabs]);

  // 关闭指定标签
  const removeTab = useCallback(
    (targetKey: string) => {
      if (targetKey === TABS_CONFIG.HOME_PATH) return;

      setTabs((prev) => {
        const nextTabs = prev.filter((t) => t.key !== targetKey);
        // 若关闭的是当前正处于激活态的 Tab，则平滑跳转至前一个相邻 Tab
        if (location.pathname === targetKey) {
          const closedIndex = prev.findIndex((t) => t.key === targetKey);
          const nextActive = nextTabs[Math.max(0, closedIndex - 1)];
          if (nextActive) {
            navigate(nextActive.key);
          }
        }
        return nextTabs;
      });
    },
    [location.pathname, navigate]
  );

  // 关闭右侧标签页
  const closeRightTabs = useCallback(() => {
    setTabs((prev) => {
      const currentIndex = prev.findIndex((t) => t.key === location.pathname);
      if (currentIndex === -1 || currentIndex >= prev.length - 1) return prev;
      return prev.slice(0, currentIndex + 1);
    });
  }, [location.pathname]);

  // 关闭其他标签
  const closeOtherTabs = useCallback(() => {
    setTabs((prev) =>
      prev.filter((t) => t.key === TABS_CONFIG.HOME_PATH || t.key === location.pathname)
    );
  }, [location.pathname]);

  // 关闭所有标签（仅保留首页）
  const closeAllTabs = useCallback(() => {
    setTabs([
      {
        key: TABS_CONFIG.HOME_PATH,
        label: defaultDashboardTitle,
        closable: false,
      },
    ]);
    navigate(TABS_CONFIG.HOME_PATH);
  }, [defaultDashboardTitle, navigate]);

  // 刷新当前页面
  const refreshCurrentTab = useCallback(() => {
    window.location.reload();
  }, []);

  // 计算当前激活标签位置是否支持“关闭右侧”
  const activeIndex = tabs.findIndex((t) => t.key === location.pathname);
  const canCloseRight = activeIndex !== -1 && activeIndex < tabs.length - 1;

  // 右侧快捷操作菜单配置
  const extraMenuItems: MenuProps["items"] = [
    {
      key: "refresh",
      label: formatMessage({ id: "tabs.refresh", defaultMessage: "刷新当前页" }),
      icon: <ReloadOutlined />,
      onClick: refreshCurrentTab,
    },
    {
      type: "divider",
    },
    {
      key: "closeRight",
      label: formatMessage({ id: "tabs.closeRight", defaultMessage: "关闭右侧标签" }),
      icon: <VerticalLeftOutlined />,
      disabled: !canCloseRight,
      onClick: closeRightTabs,
    },
    {
      key: "closeOthers",
      label: formatMessage({ id: "tabs.closeOthers", defaultMessage: "关闭其他标签" }),
      icon: <MinusCircleOutlined />,
      disabled: tabs.length <= (location.pathname === TABS_CONFIG.HOME_PATH ? 1 : 2),
      onClick: closeOtherTabs,
    },
    {
      key: "closeAll",
      label: formatMessage({ id: "tabs.closeAll", defaultMessage: "关闭所有标签" }),
      icon: <CloseCircleOutlined />,
      danger: true,
      disabled: tabs.length <= 1,
      onClick: closeAllTabs,
    },
  ];

  const tabItems = tabs.map((t) => ({
    key: t.key,
    label: (
      <span>
        {t.key === TABS_CONFIG.HOME_PATH && <DashboardOutlined style={{ marginRight: 6 }} />}
        {t.label}
      </span>
    ),
    closable: t.closable,
  }));

  return (
    <div
      className="pro-multi-tabs"
      style={{
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: "4px 16px 0 16px",
        marginBottom: 12,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
      }}
    >
      <Tabs
        size="small"
        type="editable-card"
        hideAdd
        activeKey={location.pathname}
        items={tabItems}
        onChange={(key) => navigate(key)}
        onEdit={(targetKey, action) => {
          if (action === "remove") {
            removeTab(String(targetKey));
          }
        }}
        tabBarExtraContent={
          <Dropdown menu={{ items: extraMenuItems }} placement="bottomRight" arrow>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined style={{ fontSize: 16 }} />}
              style={{ marginBottom: 4 }}
            />
          </Dropdown>
        }
        tabBarStyle={{
          margin: 0,
          borderBottom: "none",
        }}
      />
    </div>
  );
};

export default MultiTabs;
