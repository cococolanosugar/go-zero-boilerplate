import React, { useRef, useState } from "react";
import { App as AntdApp, Button, Space, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormTextArea,
  ProFormSelect,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import { useIntl } from "../../contexts/LocaleContext";

import {
  listSysNotice,
  createSysNotice,
  updateSysNotice,
  deleteSysNotice,
  type SysNoticeItem,
} from "@zero/api";
import { useDict } from "../../hooks/useDict";

export type SysNoticeRecord = SysNoticeItem;

export const SysNoticePage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysNoticeRecord | null>(null);

  // 响应式通用数据字典驱动
  const { sys_notice_type, sys_common_status } = useDict(
    "sys_notice_type",
    "sys_common_status"
  );

  const handleEdit = (record: SysNoticeRecord) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSysNotice({}, id);
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
      const payload = {
        ...values,
        noticeType: Number(values.noticeType) || 1,
        status: Number(values.status) ?? 1,
      };
      if (currentRow && currentRow.id) {
        await updateSysNotice({ ...payload, id: currentRow.id });
        message.success(
          formatMessage({ id: "common.updateSuccess", defaultMessage: "更新成功" })
        );
      } else {
        await createSysNotice(payload);
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

  const columns: ProColumns<SysNoticeRecord>[] = [
    {
      title: "公告ID",
      dataIndex: "id",
      valueType: "digit",
      hideInSearch: true,
      width: 80,
    },
    {
      title: "公告标题",
      dataIndex: "noticeTitle",
      valueType: "text",
    },
    {
      title: "公告类型",
      dataIndex: "noticeType",
      valueType: "select",
      valueEnum: sys_notice_type.valueEnum,
    },
    {
      title: "公告内容",
      dataIndex: "noticeContent",
      valueType: "textarea",
    },
    {
      title: "公告状态",
      dataIndex: "status",
      valueType: "select",
      valueEnum: sys_common_status.valueEnum,
    },
    {
      title: "创建者",
      dataIndex: "createBy",
      valueType: "text",
    },
    {
      title: "备注",
      dataIndex: "remark",
      valueType: "textarea",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      valueType: "dateTime",
      hideInSearch: true,
    },
    {
      title: "更新时间",
      dataIndex: "updateTime",
      valueType: "dateTime",
      hideInSearch: true,
    },
    {
      title: formatMessage({ id: "common.action", defaultMessage: "操作" }),
      valueType: "option",
      width: 160,
      render: (_, record) => [
        <Button
          type="link"
          key="edit"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          {formatMessage({ id: "common.edit", defaultMessage: "编辑" })}
        </Button>,
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
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={ {
        title: "通知公告表",
        breadcrumb: {
          items: [
            { title: "首页", path: "/" },
            { title: "通知公告表" },
          ],
        },
      } }
    >
      <ProTable<SysNoticeRecord>
        headerTitle="通知公告表列表"
        actionRef={actionRef}
        rowKey="id"
        search={ { labelWidth: "auto" } }
        toolBarRender={() => [
          <Button type="primary" key="add" icon={<PlusOutlined />} onClick={handleAdd}>
            {formatMessage({ id: "common.create", defaultMessage: "新建" })}
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await listSysNotice({
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
        title={currentRow ? "编辑通知公告表" : "新建通知公告表"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow || undefined}
        onFinish={handleFormSubmit}
        modalProps={ { destroyOnClose: true } }
      >
        <ProFormText
          name="noticeTitle"
          label="公告标题"
          rules={[{ required: true, message: "请输入公告标题" }]}
        />
        <ProFormSelect
          name="noticeType"
          label="公告类型"
          options={sys_notice_type.options}
          initialValue={1}
          rules={[{ required: true, message: "请选择公告类型" }]}
        />
        <ProFormTextArea
          name="noticeContent"
          label="公告内容"
          rules={[{ required: true, message: "请输入公告内容" }]}
        />
        <ProFormSelect
          name="status"
          label="公告状态（1正常 0关闭）"
          options={sys_common_status.options}
          initialValue={1}
          rules={[{ required: true, message: "请选择状态" }]}
        />
        <ProFormText
          name="createBy"
          label="创建者"
          rules={[{ required: true, message: "请输入创建者" }]}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default SysNoticePage;
