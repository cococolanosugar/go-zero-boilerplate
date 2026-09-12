import React, { useRef, useState } from "react";
import { App as AntdApp, Button, Popconfirm, Tag, Tooltip, Space } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormRadio,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import { useIntl } from "../../contexts/LocaleContext";

import {
  listSysConfig,
  createSysConfig,
  updateSysConfig,
  deleteSysConfig,
  type SysConfigItem,
} from "@zero/api";

export type SysConfigRecord = SysConfigItem;

export const SysConfigPage: React.FC = () => {
  const { message, modal } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysConfigRecord | null>(null);
  const [testingAntiRepeat, setTestingAntiRepeat] = useState(false);

  const handleEdit = (record: SysConfigRecord) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSysConfig({}, id);
      message.success(
        formatMessage({ id: "common.deleteSuccess", defaultMessage: "删除成功" })
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "删除失败");
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (currentRow && currentRow.id) {
        await updateSysConfig({ ...values, id: currentRow.id });
        message.success(
          formatMessage({ id: "common.updateSuccess", defaultMessage: "更新成功" })
        );
      } else {
        await createSysConfig(values);
        message.success(
          formatMessage({ id: "common.createSuccess", defaultMessage: "创建成功" })
        );
      }
      setModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (err: any) {
      message.error(err.message || "操作失败");
      return false;
    }
  };

  /**
   * 防重复提交演示：短时间内并发发送两个完全相同的写请求，验证网关切面的拦截能力
   */
  const handleAntiRepeatDemo = async () => {
    setTestingAntiRepeat(true);
    const hideLoading = message.loading("正在发起并发双击写入，测试网关防重复提交中间件...", 0);
    try {
      const demoKey = `demo.repeat.${Date.now()}`;
      const payload = {
        configName: "防重测试参数",
        configKey: demoKey,
        configValue: "test_val",
        configType: "N",
        remark: "系统防重复提交切面演练",
      };

      // 同时并发发出两次请求
      const [res1, res2] = await Promise.allSettled([
        createSysConfig(payload),
        createSysConfig(payload),
      ]);

      hideLoading();

      const fulfilledCount = [res1, res2].filter((r) => r.status === "fulfilled").length;
      const rejectedList = [res1, res2].filter(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult[];

      if (rejectedList.length > 0) {
        const errMsg = rejectedList[0].reason?.message || "请求过于频繁，请勿重复提交";
        modal.success({
          title: "🎉 网关防重提交拦截生效！",
          content: (
            <div style={{ marginTop: 8 }}>
              <p>
                <strong>并发请求 1：</strong>
                {res1.status === "fulfilled" ? "✅ 成功放行并写入" : `❌ 被拦截 (${(res1 as any).reason?.message})`}
              </p>
              <p>
                <strong>并发请求 2：</strong>
                {res2.status === "fulfilled" ? "✅ 成功放行并写入" : `🛡️ 被网关拦截: ${errMsg}`}
              </p>
              <p style={{ color: "#888", fontSize: 13, marginTop: 12 }}>
                💡 说明：统一网关（BFF）通过 <code>AntiRepeatMiddleware</code> 计算请求体 MD5 与用户身份特征指纹，在 5 秒防重窗口内对重复写操作进行原子锁阻断，有效杜绝手抖连击与幂等问题。
              </p>
            </div>
          ),
          okText: "知道了",
        });
      } else {
        message.info(`并发请求均已完成（成功写入 ${fulfilledCount} 条）`);
      }
      actionRef.current?.reload();
    } catch (err: any) {
      hideLoading();
      message.error(err.message || "演练执行异常");
    } finally {
      setTestingAntiRepeat(false);
    }
  };

  const columns: ProColumns<SysConfigRecord>[] = [
    {
      title: "ID",
      dataIndex: "id",
      valueType: "digit",
      hideInSearch: true,
      width: 60,
    },
    {
      title: "参数名称",
      dataIndex: "configName",
      valueType: "text",
      copyable: true,
      ellipsis: true,
    },
    {
      title: "参数键名",
      dataIndex: "configKey",
      valueType: "text",
      copyable: true,
      ellipsis: true,
    },
    {
      title: "参数键值",
      dataIndex: "configValue",
      valueType: "text",
      ellipsis: true,
    },
    {
      title: "系统内置",
      dataIndex: "configType",
      width: 100,
      valueEnum: {
        Y: { text: "系统内置", status: "Processing" },
        N: { text: "自定义", status: "Default" },
      },
      render: (_, record) =>
        record.configType === "Y" ? (
          <Tag color="blue">系统内置</Tag>
        ) : (
          <Tag color="green">自定义</Tag>
        ),
    },
    {
      title: "备注说明",
      dataIndex: "remark",
      valueType: "textarea",
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      valueType: "dateTime",
      hideInSearch: true,
      width: 170,
    },
    {
      title: "更新时间",
      dataIndex: "updateTime",
      valueType: "dateTime",
      hideInSearch: true,
      width: 170,
    },
    {
      title: formatMessage({ id: "common.action", defaultMessage: "操作" }),
      valueType: "option",
      width: 150,
      render: (_, record) => [
        <Button
          type="link"
          key="edit"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          {formatMessage({ id: "common.edit", defaultMessage: "编辑" })}
        </Button>,
        record.configType === "Y" ? (
          <Tooltip title="系统内置参数禁止删除" key="delete-disabled">
            <Button type="link" danger disabled icon={<DeleteOutlined />}>
              {formatMessage({ id: "common.delete", defaultMessage: "删除" })}
            </Button>
          </Tooltip>
        ) : (
          <Popconfirm
            key="delete"
            title={formatMessage({
              id: "common.deleteConfirm",
              defaultMessage: "确定要删除此条记录吗？",
            })}
            onConfirm={() => record.id && handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {formatMessage({ id: "common.delete", defaultMessage: "删除" })}
            </Button>
          </Popconfirm>
        ),
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: "参数设置",
        breadcrumb: {
          items: [
            { title: "首页", path: "/" },
            { title: "系统管理", path: "/system/config" },
            { title: "参数设置" },
          ],
        },
      }}
    >
      <ProTable<SysConfigRecord>
        headerTitle="系统运行参数配置"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        toolBarRender={() => [
          <Button
            key="antiRepeat"
            icon={<ThunderboltOutlined />}
            loading={testingAntiRepeat}
            onClick={handleAntiRepeatDemo}
          >
            防重提交演练
          </Button>,
          <Button type="primary" key="add" icon={<PlusOutlined />} onClick={handleAdd}>
            {formatMessage({ id: "common.create", defaultMessage: "新建参数" })}
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await listSysConfig({
              page: params.current || 1,
              pageSize: params.pageSize || 10,
              keyword: (params as any).keyword,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err: any) {
            message.error(err.message || "获取列表失败");
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
        title={currentRow ? "编辑参数" : "新建参数"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow || { configType: "N" }}
        onFinish={handleFormSubmit}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText
          name="configName"
          label="参数名称"
          rules={[{ required: true, message: "请输入参数名称" }]}
          placeholder="例如：系统默认水印开关"
        />
        <ProFormText
          name="configKey"
          label="参数键名"
          rules={[{ required: true, message: "请输入参数键名" }]}
          placeholder="例如：sys.watermark.enabled"
          disabled={!!(currentRow && currentRow.configType === "Y")}
        />
        <ProFormText
          name="configValue"
          label="参数键值"
          rules={[{ required: true, message: "请输入参数键值" }]}
          placeholder="例如：true / false 或 文本内容"
        />
        <ProFormRadio.Group
          name="configType"
          label="系统内置"
          rules={[{ required: true, message: "请选择是否系统内置" }]}
          options={[
            { label: "自定义", value: "N" },
            { label: "系统内置", value: "Y" },
          ]}
        />
        <ProFormTextArea
          name="remark"
          label="备注说明"
          placeholder="请输入参数的用途说明"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default SysConfigPage;
