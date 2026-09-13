import React, { useRef, useState } from "react";
import { App as AntdApp, Button, Space, Tag, Popconfirm, Switch, Tooltip } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormRadio,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  runTaskOnce,
  type AsyncTaskItem,
} from "@zero/api";
import { PERMISSIONS, copyToClipboard } from "@zero/shared";
import { Access } from "../../components/Access";
import { useIntl } from "../../contexts/LocaleContext";

export const SysTaskPage: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<AsyncTaskItem | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);

  const handleEdit = (record: AsyncTaskItem) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask({}, id);
      message.success("任务已成功删除并从 Temporal 注销");
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "删除任务失败");
    }
  };

  const handleToggleStatus = async (record: AsyncTaskItem, checked: boolean) => {
    const newStatus = checked ? 1 : 0;
    try {
      await toggleTaskStatus({}, { status: newStatus }, record.id);
      message.success(checked ? "任务已成功启用并同步至 Temporal" : "任务已暂停调度");
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "切换状态失败");
    }
  };

  const handleRunOnce = async (record: AsyncTaskItem) => {
    try {
      setRunningId(record.id);
      const res = await runTaskOnce({}, record.id);
      notification.success({
        message: "任务触发成功",
        description: (
          <div>
            <div><strong>工作流ID:</strong> {res.workflowId}</div>
            <div><strong>RunID:</strong> {res.runId}</div>
            <div>{res.message}</div>
          </div>
        ),
        duration: 4.5,
      });
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "触发任务执行失败");
    } finally {
      setRunningId(null);
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        status: Number(values.status) ?? 1,
      };

      if (currentRow && currentRow.id) {
        await updateTask({}, payload, currentRow.id);
        message.success("异步任务配置更新成功并同步至 Temporal");
      } else {
        await createTask(payload);
        message.success("异步任务创建成功并已注册至 Temporal 调度器");
      }
      setModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (err: any) {
      message.error(err.message || "保存任务失败");
      return false;
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "RUNNING":
        return <Tag icon={<SyncOutlined spin />} color="processing">运行中</Tag>;
      case "SUCCESS":
        return <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>;
      case "FAILED":
        return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>;
      default:
        return <Tag icon={<ClockCircleOutlined />} color="default">就绪/空闲</Tag>;
    }
  };

  const columns: ProColumns<AsyncTaskItem>[] = [
    {
      title: "任务ID",
      dataIndex: "id",
      valueType: "digit",
      hideInSearch: true,
      width: 70,
    },
    {
      title: "任务名称",
      dataIndex: "taskName",
      valueType: "text",
      render: (_, record) => <strong>{record.taskName}</strong>,
    },
    {
      title: "任务标识 (Key)",
      dataIndex: "taskKey",
      valueType: "text",
      render: (_, record) => (
        <Tooltip title="点击复制 TaskKey">
          <Tag
            color="geekblue"
            style={{ cursor: "pointer", fontFamily: "monospace" }}
            onClick={() => {
              copyToClipboard(record.taskKey);
              message.success("任务标识已复制至剪贴板");
            }}
          >
            {record.taskKey}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "任务类型",
      dataIndex: "taskType",
      valueType: "select",
      valueEnum: {
        CRON: { text: "CRON 定时", status: "Processing" },
        WORKFLOW: { text: "工作流编排", status: "Success" },
      },
      render: (_, record) => (
        <Tag color={record.taskType === "CRON" ? "purple" : "cyan"}>
          {record.taskType}
        </Tag>
      ),
    },
    {
      title: "Cron 表达式",
      dataIndex: "cronExpr",
      valueType: "text",
      hideInSearch: true,
      render: (_, record) =>
        record.cronExpr ? (
          <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: 4 }}>
            {record.cronExpr}
          </code>
        ) : (
          <span style={{ color: "#bbb" }}>-</span>
        ),
    },
    {
      title: "工作流类型",
      dataIndex: "workflowType",
      valueType: "text",
      hideInSearch: true,
      render: (_, record) => <Tag color="blue">{record.workflowType}</Tag>,
    },
    {
      title: "任务队列",
      dataIndex: "taskQueue",
      valueType: "text",
      hideInSearch: true,
      render: (_, record) => <span style={{ fontFamily: "monospace" }}>{record.taskQueue}</span>,
    },
    {
      title: "调度状态",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        1: { text: "启用中", status: "Success" },
        0: { text: "已暂停", status: "Default" },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          checkedChildren="启用"
          unCheckedChildren="暂停"
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: "最近执行状态",
      dataIndex: "lastRunStatus",
      valueType: "text",
      hideInSearch: true,
      render: (_, record) => getStatusBadge(record.lastRunStatus),
    },
    {
      title: "最近执行时间",
      dataIndex: "lastRunTime",
      valueType: "text",
      hideInSearch: true,
      width: 160,
      render: (_, record) => record.lastRunTime || <span style={{ color: "#bbb" }}>未曾运行</span>,
    },
    {
      title: "备注说明",
      dataIndex: "remark",
      valueType: "text",
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: formatMessage({ id: "common.action", defaultMessage: "操作" }),
      valueType: "option",
      width: 220,
      fixed: "right",
      render: (_, record) => [
        <Access key="trigger" permission={PERMISSIONS.TASK_TRIGGER}>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={runningId === record.id}
            onClick={() => handleRunOnce(record)}
          >
            立即执行
          </Button>
        </Access>,
        <Access key="edit" permission={PERMISSIONS.TASK_EDIT}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Access>,
        <Access key="delete" permission={PERMISSIONS.TASK_DELETE}>
          <Popconfirm
            title="确定要删除此任务并注销 Temporal 调度吗？"
            onConfirm={() => record.id && handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Access>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: "异步任务管理",
        breadcrumb: {
          items: [
            { title: "首页", path: "/" },
            { title: "异步任务管理" },
          ],
        },
      }}
    >
      <ProTable<AsyncTaskItem>
        headerTitle="Temporal 异步任务调度中心"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        toolBarRender={() => [
          <Access key="add" permission={PERMISSIONS.TASK_ADD}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建任务
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          try {
            const res = await listTasks({
              page: params.current || 1,
              pageSize: params.pageSize || 10,
              taskName: (params as any).taskName,
              taskKey: (params as any).taskKey,
              status: params.status !== undefined && params.status !== "" ? Number(params.status) : -1,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err: any) {
            message.error(err.message || "获取任务列表失败");
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
      />

      <ModalForm
        title={currentRow ? "编辑异步任务" : "新建异步任务"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={
          currentRow || {
            taskType: "CRON",
            workflowType: "OrderSagaWorkflow",
            taskQueue: "ORDER_TASK_QUEUE",
            status: 1,
          }
        }
        onFinish={handleFormSubmit}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText
          name="taskName"
          label="任务名称"
          placeholder="如: 订单超时自动巡检补偿"
          rules={[{ required: true, message: "请输入任务名称" }]}
        />
        <ProFormText
          name="taskKey"
          label="任务标识 (TaskKey)"
          placeholder="唯一英文标识，如: order_saga_patrol"
          disabled={!!currentRow}
          rules={[{ required: true, message: "请输入唯一的任务标识" }]}
        />
        <ProFormSelect
          name="taskType"
          label="任务类型"
          options={[
            { label: "CRON 定时周期任务", value: "CRON" },
            { label: "WORKFLOW 编排任务", value: "WORKFLOW" },
          ]}
          rules={[{ required: true, message: "请选择任务类型" }]}
        />
        <ProFormText
          name="cronExpr"
          label="Cron 调度表达式"
          placeholder="如: */10 * * * * 或 0 0 1 * *"
          tooltip="标准 5 段式或 6 段式 Cron 表达式，将在 Temporal Schedule 注册生效"
          rules={[{ required: true, message: "请输入 Cron 调度表达式" }]}
        />
        <ProFormSelect
          name="workflowType"
          label="关联 Temporal 工作流"
          options={[
            { label: "OrderSagaWorkflow (订单分布式 Saga 工作流)", value: "OrderSagaWorkflow" },
          ]}
          rules={[{ required: true, message: "请选择关联的 Temporal 工作流" }]}
        />
        <ProFormText
          name="taskQueue"
          label="Temporal 任务队列"
          placeholder="ORDER_TASK_QUEUE"
          rules={[{ required: true, message: "请输入任务队列" }]}
        />
        <ProFormTextArea
          name="payload"
          label="默认参数 JSON"
          placeholder='{"orderId": 1001, "item": "定时巡检", "amount": 99.0}'
          tooltip="任务启动时传递给 Temporal Workflow 的入参结构体"
        />
        <ProFormRadio.Group
          name="status"
          label="初始调度状态"
          options={[
            { label: "立即启用 (同步激活 Temporal Schedule)", value: 1 },
            { label: "暂停/停用 (Temporal Schedule 保持暂停态)", value: 0 },
          ]}
          rules={[{ required: true, message: "请选择调度状态" }]}
        />
        <ProFormTextArea
          name="remark"
          label="备注说明"
          placeholder="填写任务维护背景或注意事项"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default SysTaskPage;
