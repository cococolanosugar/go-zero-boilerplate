import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Badge,
  Popover,
  Tabs,
  Avatar,
  Tag,
  Button,
  Empty,
  Typography,
  App,
} from "antd";
import {
  BellOutlined,
  NotificationOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export interface NoticeItem {
  id: string;
  title: string;
  datetime?: string;
  type: "notification" | "message" | "event";
  read?: boolean;
  avatar?: string;
  description?: string;
  extra?: string;
  status?: "default" | "processing" | "success" | "warning" | "error";
}

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: "notif-1",
    title: "微服务网关限流阈值自动扩容成功",
    datetime: "10 分钟前",
    type: "notification",
    status: "success",
    description: "自适应负载均衡器根据 QPS 激增自动调度至备用实例",
  },
  {
    id: "notif-2",
    title: "MySQL 持久层 Redis 缓存命中率达到 98.6%",
    datetime: "35 分钟前",
    type: "notification",
    status: "processing",
    description: "Cache-Aside 策略有效阻断穿透与雪崩",
  },
  {
    id: "msg-1",
    title: "架构师（李明）评论了你的订单聚合逻辑",
    datetime: "1 小时前",
    type: "message",
    avatar: "https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg",
    description: "并发任务 mr.Finish 设计很合理，时延降低了 45%",
  },
  {
    id: "msg-2",
    title: "运维中心发送了 Nacos 集群状态报告",
    datetime: "2 小时前",
    type: "message",
    avatar: "https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png",
    description: "User RPC (8080) 与 Order RPC (8081) 运行平稳",
  },
  {
    id: "todo-1",
    title: "审批订单 #ORD-2026-9082 退款流程",
    datetime: "今日 18:00 前",
    type: "event",
    extra: "即将到期",
    status: "warning",
    description: "需技术负责人与财务主管双重 RBAC 审批",
  },
  {
    id: "todo-2",
    title: "全站依赖安全性升级检测 (mise 锁定期)",
    datetime: "本周五",
    type: "event",
    extra: "进行中",
    status: "processing",
    description: "更新 Ant Design 6 与 Vite 构建优化插件",
  },
];

export const NoticeIcon: React.FC = () => {
  const { message } = App.useApp();
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) {
      return;
    }

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/v1/system/notice/stream");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.type === "notice" && data.title) {
            setNotices((prev) => [
              {
                id: data.id || `sse-${Date.now()}`,
                title: data.title,
                datetime: data.datetime || "刚刚",
                type: data.category === "message" ? "message" : data.category === "event" ? "event" : "notification",
                status: data.status || "processing",
                description: data.description,
              },
              ...prev,
            ]);
          }
        } catch {
          // ignore parsing error
        }
      };
      es.onerror = () => {
        // SSE browser auto-reconnects
      };
    } catch {
      // ignore
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notices.filter((item) => !item.read).length;
  }, [notices]);

  const markItemAsRead = useCallback((id: string) => {
    setNotices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const clearCategory = useCallback(
    (type: "notification" | "message" | "event", typeName: string) => {
      setNotices((prev) => prev.filter((item) => item.type !== type));
      message.success(`已清空所有${typeName}`);
    },
    [message]
  );

  const renderNoticeList = (type: "notification" | "message" | "event", typeName: string) => {
    const list = notices.filter((n) => n.type === type);
    if (list.length === 0) {
      return (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`暂无${typeName}`} />
        </div>
      );
    }

    return (
      <div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {list.map((item) => (
            <div
              key={item.id}
              onClick={() => markItemAsRead(item.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                padding: "12px 16px",
                transition: "all 0.3s",
                opacity: item.read ? 0.55 : 1,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {item.avatar ? (
                <Avatar src={item.avatar} />
              ) : type === "notification" ? (
                <Avatar
                  style={{ backgroundColor: "#1677ff" }}
                  icon={<NotificationOutlined />}
                />
              ) : (
                <Avatar
                  style={{ backgroundColor: "#52c41a" }}
                  icon={<CheckCircleOutlined />}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text strong={!item.read} style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                  {item.extra && (
                    <Tag
                      color={
                        item.status === "warning"
                          ? "volcano"
                          : item.status === "processing"
                          ? "blue"
                          : "default"
                      }
                      style={{ marginRight: 0 }}
                    >
                      {item.extra}
                    </Tag>
                  )}
                </div>
                {item.description && (
                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 12, marginBottom: 4, marginTop: 4 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {item.description}
                  </Paragraph>
                )}
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {item.datetime}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "center",
            padding: "8px 0",
          }}
        >
          <Button
            type="link"
            size="small"
            icon={<ClearOutlined />}
            onClick={() => clearCategory(type, typeName)}
          >
            清空{typeName}
          </Button>
        </div>
      </div>
    );
  };

  const notificationCount = notices.filter((n) => n.type === "notification" && !n.read).length;
  const messageCount = notices.filter((n) => n.type === "message" && !n.read).length;
  const todoCount = notices.filter((n) => n.type === "event" && !n.read).length;

  const content = (
    <div style={{ width: 340 }}>
      <Tabs
        defaultActiveKey="1"
        centered
        items={[
          {
            key: "1",
            label: `通知 (${notificationCount})`,
            children: renderNoticeList("notification", "通知"),
          },
          {
            key: "2",
            label: `消息 (${messageCount})`,
            children: renderNoticeList("message", "消息"),
          },
          {
            key: "3",
            label: `待办 (${todoCount})`,
            children: renderNoticeList("event", "待办"),
          },
        ]}
      />
    </div>
  );

  return (
    <Popover
      placement="bottomRight"
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      styles={{ content: { padding: 0 } }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8px",
          cursor: "pointer",
          height: "100%",
        }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 17, padding: 4 }} />
        </Badge>
      </span>
    </Popover>
  );
};

export default NoticeIcon;
