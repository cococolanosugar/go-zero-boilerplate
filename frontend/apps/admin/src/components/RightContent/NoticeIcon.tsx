import React, { useState } from "react";
import { Badge, Popover, Tabs, Avatar, Tag, Button, Empty, Tooltip, Space, Typography } from "antd";
import {
  BellOutlined,
  NotificationOutlined,
  MailOutlined,
  ScheduleOutlined,
  CheckOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useIntl } from "../../contexts/LocaleContext";

const { Text } = Typography;

export interface NoticeItem {
  id: string;
  title: string;
  description: string;
  datetime: string;
  read: boolean;
  category: "notification" | "message" | "task";
  tag?: string;
  tagColor?: string;
  extra?: string;
}

const initialNotices: NoticeItem[] = [
  {
    id: "1",
    category: "notification",
    title: "微服务集群全绿运行",
    description: "User RPC 与 Order RPC 节点就绪，心跳延时 < 2ms",
    datetime: "10分钟前",
    read: false,
    tag: "服务健康",
    tagColor: "green",
  },
  {
    id: "2",
    category: "notification",
    title: "统一网关动态路由就绪",
    description: "HTTP 8888 统一网关与 BFF 层路由已就绪",
    datetime: "30分钟前",
    read: false,
    tag: "网关",
    tagColor: "blue",
  },
  {
    id: "3",
    category: "message",
    title: "管理员角色权限变更通知",
    description: "系统角色已自动更新 5 级数据权限与按钮级权限控制",
    datetime: "1小时前",
    read: false,
    tag: "安全",
    tagColor: "orange",
  },
  {
    id: "4",
    category: "message",
    title: "新员工加入审批提醒",
    description: "研发部提交了 1 名新员工微服务权限开通申请",
    datetime: "2小时前",
    read: false,
    tag: "审批",
    tagColor: "purple",
  },
  {
    id: "5",
    category: "task",
    title: "双日志审计归档校验",
    description: "定期核验 sys_oper_log 与 sys_login_log 日志表冷备状态",
    datetime: "今日 18:00 前",
    read: false,
    tag: "进行中",
    tagColor: "processing",
    extra: "进度 70%",
  },
  {
    id: "6",
    category: "task",
    title: "全栈 Monorepo 容器交付编排",
    description: "验证 docker-compose 一键拉起全链路基础设施与前后端服务",
    datetime: "明日 12:00 前",
    read: false,
    tag: "待办",
    tagColor: "warning",
    extra: "未开始",
  },
];

export const NoticeIcon: React.FC = () => {
  const { formatMessage } = useIntl();
  const [notices, setNotices] = useState<NoticeItem[]>(initialNotices);
  const [open, setOpen] = useState(false);

  const unreadCount = notices.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotices((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markCategoryAsRead = (category: "notification" | "message" | "task") => {
    setNotices((prev) =>
      prev.map((item) => (item.category === category ? { ...item, read: true } : item))
    );
  };

  const clearCategory = (category: "notification" | "message" | "task") => {
    setNotices((prev) => prev.filter((item) => item.category !== category));
  };

  const renderList = (category: "notification" | "message" | "task") => {
    const list = notices.filter((n) => n.category === category);
    const categoryUnread = list.filter((n) => !n.read).length;

    if (list.length === 0) {
      return (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无内容" />
        </div>
      );
    }

    return (
      <div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {list.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                opacity: item.read ? 0.55 : 1,
                padding: "10px 16px",
                borderBottom: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
                transition: "background 0.2s",
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {category === "notification" ? (
                  <Avatar
                    style={{ backgroundColor: item.read ? "#ccc" : "#1677ff" }}
                    icon={<NotificationOutlined />}
                  />
                ) : category === "message" ? (
                  <Avatar
                    style={{ backgroundColor: item.read ? "#ccc" : "#52c41a" }}
                    icon={<MailOutlined />}
                  />
                ) : (
                  <Avatar
                    style={{ backgroundColor: item.read ? "#ccc" : "#faad14" }}
                    icon={<ScheduleOutlined />}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Space orientation="horizontal" size={6} wrap style={{ marginBottom: 2 }}>
                  <Text strong={!item.read} style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                  {item.tag && (
                    <Tag color={item.tagColor} style={{ marginRight: 0, fontSize: 11, lineHeight: "18px" }}>
                      {item.tag}
                    </Tag>
                  )}
                </Space>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                  {item.description}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>
                  {item.datetime} {item.extra && `· ${item.extra}`}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
            padding: "8px 16px 4px",
          }}
        >
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            disabled={categoryUnread === 0}
            onClick={() => markCategoryAsRead(category)}
          >
            全部已读
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<ClearOutlined />}
            onClick={() => clearCategory(category)}
          >
            清空
          </Button>
        </div>
      </div>
    );
  };

  const notificationCount = notices.filter((n) => n.category === "notification" && !n.read).length;
  const messageCount = notices.filter((n) => n.category === "message" && !n.read).length;
  const taskCount = notices.filter((n) => n.category === "task" && !n.read).length;

  const tabItems = [
    {
      key: "notification",
      label: `通知 (${notificationCount})`,
      children: renderList("notification"),
    },
    {
      key: "message",
      label: `消息 (${messageCount})`,
      children: renderList("message"),
    },
    {
      key: "task",
      label: `待办 (${taskCount})`,
      children: renderList("task"),
    },
  ];

  const content = (
    <div style={{ width: 340 }}>
      <Tabs defaultActiveKey="notification" items={tabItems} centered size="small" />
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      styles={{
        content: { padding: "4px 0 8px" },
      }}
    >
      <Tooltip title={formatMessage({ id: "navBar.notice", defaultMessage: "通知消息与待办中心" })}>
        <span style={{ cursor: "pointer", padding: "0 8px", display: "inline-flex", alignItems: "center" }}>
          <Badge count={unreadCount} size="small" offset={[2, -2]}>
            <BellOutlined style={{ fontSize: 16 }} />
          </Badge>
        </span>
      </Tooltip>
    </Popover>
  );
};

export default NoticeIcon;
