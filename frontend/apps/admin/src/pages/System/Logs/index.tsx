import React, { useRef, useState } from "react";
import {
  Card,
  Tabs,
  Tag,
  Badge,
  Button,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import {
  HistoryOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  listSysOperLogs,
  listSysLoginLogs,
  type SysOperLogItem,
  type SysLoginLogItem,
} from "@zero/api";
import { PERMISSIONS } from "@zero/shared";
import { Access } from "../../../components/Access";
import { useIntl } from "../../../contexts/LocaleContext";

const { Paragraph, Text } = Typography;

const METHOD_COLORS: Record<string, string> = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
};

export const LogsPage: React.FC = () => {
  const { formatMessage } = useIntl();
  const operActionRef = useRef<ActionType>(null);
  const loginActionRef = useRef<ActionType>(null);

  // 操作日志详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOperLog, setCurrentOperLog] = useState<SysOperLogItem | null>(null);

  const showDetail = (record: SysOperLogItem) => {
    setCurrentOperLog(record);
    setDetailVisible(true);
  };

  // 操作日志表格列配置
  const operColumns: ProColumns<SysOperLogItem>[] = [
    {
      title: "编号",
      dataIndex: "id",
      width: 70,
      search: false,
    },
    {
      title: "系统模块 / 业务操作",
      dataIndex: "title",
      copyable: true,
      ellipsis: true,
    },
    {
      title: "请求方式",
      dataIndex: "operMethod",
      width: 100,
      search: false,
      render: (_, record) => {
        const method = (record.operMethod || "GET").toUpperCase();
        return <Tag color={METHOD_COLORS[method] || "default"}>{method}</Tag>;
      },
    },
    {
      title: "操作人员",
      dataIndex: "operName",
      width: 120,
    },
    {
      title: "主机 IP",
      dataIndex: "operIp",
      width: 130,
      search: false,
      copyable: true,
    },
    {
      title: "请求接口 URL",
      dataIndex: "operUrl",
      ellipsis: true,
      search: false,
      copyable: true,
    },
    {
      title: "执行耗时",
      dataIndex: "costTime",
      width: 100,
      search: false,
      render: (_, record) => {
        const ms = record.costTime ?? 0;
        let color = "success";
        if (ms > 1000) {
          color = "error";
        } else if (ms > 300) {
          color = "warning";
        }
        return <Tag color={color}>{ms}ms</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      valueType: "select",
      valueEnum: {
        1: { text: "成功", status: "Success" },
        0: { text: "失败", status: "Error" },
      },
      render: (_, record) =>
        record.status === 1 ? (
          <Badge status="success" text="正常" />
        ) : (
          <Badge status="error" text="异常" />
        ),
    },
    {
      title: "操作时间",
      dataIndex: "createTime",
      width: 170,
      search: false,
    },
    {
      title: "操作",
      valueType: "option",
      width: 80,
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          详情
        </Button>,
      ],
    },
  ];

  // 登录日志表格列配置
  const loginColumns: ProColumns<SysLoginLogItem>[] = [
    {
      title: "编号",
      dataIndex: "id",
      width: 70,
      search: false,
    },
    {
      title: "登录账号",
      dataIndex: "username",
      width: 130,
    },
    {
      title: "登录 IP",
      dataIndex: "loginIp",
      width: 140,
      search: false,
      copyable: true,
    },
    {
      title: "浏览器",
      dataIndex: "browser",
      width: 140,
      search: false,
      render: (text) => <Tag color="cyan">{text || "Unknown"}</Tag>,
    },
    {
      title: "操作系统",
      dataIndex: "os",
      width: 140,
      search: false,
      render: (text) => <Tag color="purple">{text || "Unknown"}</Tag>,
    },
    {
      title: "登录状态",
      dataIndex: "status",
      width: 100,
      valueType: "select",
      valueEnum: {
        1: { text: "成功", status: "Success" },
        0: { text: "失败", status: "Error" },
      },
      render: (_, record) =>
        record.status === 1 ? (
          <Badge status="success" text="成功" />
        ) : (
          <Badge status="error" text="失败" />
        ),
    },
    {
      title: "提示消息",
      dataIndex: "msg",
      search: false,
      ellipsis: true,
      render: (text, record) =>
        record.status === 1 ? (
          <Text type="secondary">{text || "登录成功"}</Text>
        ) : (
          <Text type="danger">{text || "登录失败"}</Text>
        ),
    },
    {
      title: "登录时间",
      dataIndex: "loginTime",
      width: 170,
      search: false,
    },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.system.logs.title", defaultMessage: "企业审计日志中心" }),
        subTitle: formatMessage({ id: "pages.system.logs.subTitle", defaultMessage: "实时记录全量写操作审计与系统员工登录认证日志" }),
      }}
    >
      <Card variant="borderless">
      <Tabs
        defaultActiveKey="oper"
        items={[
          {
            key: "oper",
            label: (
              <span>
                <HistoryOutlined />
                操作日志 (OperLog)
              </span>
            ),
            children: (
              <Access permission={PERMISSIONS.LOG_OPER_QUERY} fallbackMode="hide">
                <ProTable<SysOperLogItem>
                  headerTitle="系统操作审计日志"
                  actionRef={operActionRef}
                  rowKey="id"
                  search={{
                    labelWidth: "auto",
                  }}
                  toolBarRender={() => [
                    <Button
                      key="refresh"
                      icon={<ReloadOutlined />}
                      onClick={() => operActionRef.current?.reload()}
                    >
                      刷新
                    </Button>,
                  ]}
                  request={async (params) => {
                    const res = await listSysOperLogs({
                      page: params.current || 1,
                      pageSize: params.pageSize || 10,
                      title: params.title,
                      operName: params.operName,
                      status: params.status !== undefined ? Number(params.status) : undefined,
                    });
                    return {
                      data: res.list || [],
                      success: true,
                      total: res.total,
                    };
                  }}
                  columns={operColumns}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                  }}
                />
              </Access>
            ),
          },
          {
            key: "login",
            label: (
              <span>
                <SafetyCertificateOutlined />
                登录日志 (LoginLog)
              </span>
            ),
            children: (
              <Access permission={PERMISSIONS.LOG_LOGIN_QUERY} fallbackMode="hide">
                <ProTable<SysLoginLogItem>
                  headerTitle="系统登录认证日志"
                  actionRef={loginActionRef}
                  rowKey="id"
                  search={{
                    labelWidth: "auto",
                  }}
                  toolBarRender={() => [
                    <Button
                      key="refresh"
                      icon={<ReloadOutlined />}
                      onClick={() => loginActionRef.current?.reload()}
                    >
                      刷新
                    </Button>,
                  ]}
                  request={async (params) => {
                    const res = await listSysLoginLogs({
                      page: params.current || 1,
                      pageSize: params.pageSize || 10,
                      username: params.username,
                      status: params.status !== undefined ? Number(params.status) : undefined,
                    });
                    return {
                      data: res.list || [],
                      success: true,
                      total: res.total,
                    };
                  }}
                  columns={loginColumns}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                  }}
                />
              </Access>
            ),
          },
        ]}
      />

      {/* 操作日志详情查看弹窗 */}
      <Modal
        title="操作日志详细信息"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {currentOperLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="日志编号">
              {currentOperLog.id}
            </Descriptions.Item>
            <Descriptions.Item label="系统模块">
              {currentOperLog.title}
            </Descriptions.Item>
            <Descriptions.Item label="操作人员">
              {currentOperLog.operName}
            </Descriptions.Item>
            <Descriptions.Item label="操作 IP">
              {currentOperLog.operIp}
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              <Tag color={METHOD_COLORS[(currentOperLog.operMethod || "GET").toUpperCase()] || "default"}>
                {currentOperLog.operMethod}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="执行耗时">
              {currentOperLog.costTime} ms
            </Descriptions.Item>
            <Descriptions.Item label="操作状态" span={2}>
              {currentOperLog.status === 1 ? (
                <Badge status="success" text="成功" />
              ) : (
                <Badge status="error" text="失败" />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="请求地址" span={2}>
              <Paragraph copyable style={{ marginBottom: 0 }}>
                {currentOperLog.operUrl}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {currentOperLog.createTime}
            </Descriptions.Item>
            {currentOperLog.errorMsg && (
              <Descriptions.Item label="错误原因 / 堆栈" span={2}>
                <Text type="danger">{currentOperLog.errorMsg}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </Card>
    </PageContainer>
  );
};

export default LogsPage;
