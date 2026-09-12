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
  listSysPost,
  createSysPost,
  updateSysPost,
  deleteSysPost,
  type SysPostItem,
} from "@zero/api";
import { useDict } from "../../hooks/useDict";

export type SysPostRecord = SysPostItem;

export const SysPostPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysPostRecord | null>(null);

  // 通用字典驱动
  const { options: statusOptions, valueEnum: statusValueEnum } = useDict("sys_common_status");

  const handleEdit = (record: SysPostRecord) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSysPost({}, id);
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
        await updateSysPost({ ...values, id: currentRow.id });
        message.success(
          formatMessage({ id: "common.updateSuccess", defaultMessage: "更新成功" })
        );
      } else {
        await createSysPost(values);
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

  const columns: ProColumns<SysPostRecord>[] = [
    {
      title: "岗位ID",
      dataIndex: "id",
      valueType: "digit",
      hideInSearch: true,
      width: 80,
    },
    {
      title: "岗位编码",
      dataIndex: "postCode",
      valueType: "text",
    },
    {
      title: "岗位名称",
      dataIndex: "postName",
      valueType: "text",
    },
    {
      title: "显示顺序",
      dataIndex: "postSort",
      valueType: "digit",
    },
    {
      title: "状态（1正常 0停用）",
      dataIndex: "status",
      valueType: "select",
      valueEnum: statusValueEnum,
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
        title: "岗位信息表",
        breadcrumb: {
          items: [
            { title: "首页", path: "/" },
            { title: "岗位信息表" },
          ],
        },
      } }
    >
      <ProTable<SysPostRecord>
        headerTitle="岗位信息表列表"
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
            const res = await listSysPost({
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
        title={currentRow ? "编辑岗位信息表" : "新建岗位信息表"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow || undefined}
        onFinish={handleFormSubmit}
        modalProps={ { destroyOnClose: true } }
      >
        <ProFormText
          name="postCode"
          label="岗位编码"
          rules={[{ required: true, message: "请输入岗位编码" }]}
        />
        <ProFormText
          name="postName"
          label="岗位名称"
          rules={[{ required: true, message: "请输入岗位名称" }]}
        />
        <ProFormDigit
          name="postSort"
          label="显示顺序"
          rules={[{ required: true, message: "请输入显示顺序" }]}
        />
        <ProFormSelect
          name="status"
          label="状态（1正常 0停用）"
          options={statusOptions}
          initialValue={1}
          rules={[{ required: true, message: "请选择状态" }]}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default SysPostPage;
