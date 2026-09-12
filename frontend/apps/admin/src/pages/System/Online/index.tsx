import React, { useRef, useState } from "react";
import {
  Tag,
  Badge,
  Button,
  Popconfirm,
  Typography,
  Space,
  Tooltip,
  App,
} from "antd";
import {
  UserOutlined,
  StopOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  listOnlineSessions,
  forceLogoutOnlineSession,
  type OnlineSessionItem,
} from "@zero/api";
import { PERMISSIONS } from "@zero/shared";
import { Access } from "../../../components/Access";

const { Text } = Typography;

export const OnlineUsersPage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // 强制下线会话
  const handleForceLogout = async (sessionId: string) => {
    try {
      await forceLogoutOnlineSession({}, sessionId);
      message.success("强制下线成功，该会话 Token 已加入黑名单作废");
      actionRef.current?.reload();
    } catch (error: unknown) {
      const err = error as { msg?: string; message?: string };
      message.error(err.msg || err.message || "强制下线失败");
    }
  };

  const columns: ProColumns<OnlineSessionItem>[] = [
    {
      title: "会话标识",
      dataIndex: "sessionId",
      width: 140,
      search: false,
      copyable: true,
      ellipsis: true,
    },
    {
      title: "登录账号",
      dataIndex: "username",
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <UserOutlined />
          <Text strong>{record.username}</Text>
        </Space>
      ),
    },
    {
      title: "用户姓名",
      dataIndex: "realName",
      width: 120,
      search: false,
    },
    {
      title: "所属部门",
      dataIndex: "deptName",
      width: 120,
      search: false,
      render: (val) => (val ? String(val) : "-"),
    },
    {
      title: "登录 IP",
      dataIndex: "loginIp",
      width: 130,
      copyable: true,
    },
    {
      title: "登录地点",
      dataIndex: "loginLocation",
      width: 130,
      search: false,
      render: (_, record) => {
        const loc = record.loginLocation || "未知网络";
        let color = "default";
        if (loc.includes("本机") || loc.includes("内网")) {
          color = "blue";
        } else if (loc.includes("外网")) {
          color = "cyan";
        }
        return <Tag color={color}>{loc}</Tag>;
      },
    },
    {
      title: "浏览器",
      dataIndex: "browser",
      width: 110,
      search: false,
      render: (val) => <Tag color="geekblue">{String(val || "未知")}</Tag>,
    },
    {
      title: "操作系统",
      dataIndex: "os",
      width: 110,
      search: false,
      render: (val) => <Tag color="purple">{String(val || "未知")}</Tag>,
    },
    {
      title: "登录时间",
      dataIndex: "loginTime",
      width: 170,
      search: false,
    },
    {
      title: "会话状态",
      dataIndex: "isCurrent",
      width: 120,
      search: false,
      render: (_, record) =>
        record.isCurrent ? (
          <Badge status="processing" text={<Text type="success" strong>当前会话</Text>} />
        ) : (
          <Badge status="success" text="在线" />
        ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 110,
      fixed: "right",
      render: (_, record) => {
        if (record.isCurrent) {
          return (
            <Tooltip title="不能强退当前正在操作的自身登录会话">
              <Button type="link" size="small" disabled>
                自身会话
              </Button>
            </Tooltip>
          );
        }
        return (
          <Access accessible={PERMISSIONS.ONLINE_FORCE}>
            <Popconfirm
              title="确定强制该用户下线吗？"
              description="强退后该用户的访问令牌将立即进入 Redis 黑名单并失效。"
              okText="确认强退"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleForceLogout(record.sessionId)}
            >
              <Button type="link" danger size="small" icon={<StopOutlined />}>
                强退
              </Button>
            </Popconfirm>
          </Access>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: "在线用户监控",
        subTitle: "实时监控系统当前全部活跃会话与登录终端，支持管理员在线强制下线违规或异地登录态",
      }}
    >
      <ProTable<OnlineSessionItem>
        headerTitle={
          <Space>
            <TeamOutlined />
            <span>当前全网活跃会话数</span>
            <Tag color="green">{totalCount}</Tag>
          </Space>
        }
        actionRef={actionRef}
        rowKey="sessionId"
        columns={columns}
        request={async (params) => {
          const res: any = await listOnlineSessions({
            page: params.current || 1,
            pageSize: params.pageSize || 10,
            username: params.username,
            loginIp: params.loginIp,
          });
          const list = res?.list || res?.data?.list || [];
          const total = Number(res?.total ?? res?.data?.total ?? 0);
          setTotalCount(total);
          return {
            data: list,
            total,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        search={{
          labelWidth: "auto",
        }}
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新会话
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default OnlineUsersPage;
