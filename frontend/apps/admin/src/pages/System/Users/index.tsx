import React, { useRef, useState, useEffect } from "react";
import { App as AntdApp, Button, Space, Tag, Popconfirm, Avatar, Badge } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormSelect,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  systemUsersApi,
  systemRolesApi,
  toProTableRequest,
} from "../../../services";
import type { SysUserItem } from "@zero/api";
import { PERMISSIONS } from "@zero/shared";
import { Access } from "../../../components/Access";
import { useIntl } from "../../../contexts/LocaleContext";

export const UsersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysUserItem | null>(null);
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: number }[]>([]);

  // 加载角色字典选项
  useEffect(() => {
    systemRolesApi.list({ page: 1, pageSize: 100 }).then((res) => {
      setRoleOptions(
        (res.list || []).map((r) => ({
          label: `${r.name} (${r.code})`,
          value: r.id,
        }))
      );
    });
  }, []);

  const handleEdit = (record: SysUserItem) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await systemUsersApi.remove({}, id);
    message.success("员工删除成功");
    actionRef.current?.reload();
  };

  const handleFormSubmit = async (values: any) => {
    if (currentRow) {
      await systemUsersApi.update({
        id: currentRow.id,
        deptId: values.deptId || 1,
        realName: values.realName,
        mobile: values.mobile || "",
        email: values.email || "",
        status: values.status ?? 1,
        roleIds: values.roleIds || [],
      });
      message.success("更新员工信息成功");
    } else {
      await systemUsersApi.create({
        deptId: values.deptId || 1,
        username: values.username,
        password: values.password,
        realName: values.realName,
        mobile: values.mobile || "",
        email: values.email || "",
        roleIds: values.roleIds || [],
      });
      message.success("创建员工成功");
    }
    setModalVisible(false);
    actionRef.current?.reload();
    return true;
  };

  const columns: ProColumns<SysUserItem>[] = [
    {
      title: "员工信息",
      dataIndex: "username",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1677ff" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.realName || record.username}</div>
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "手机号",
      dataIndex: "mobile",
      copyable: true,
      search: false,
    },
    {
      title: "所属部门",
      dataIndex: "deptName",
      search: false,
      render: (text) => <Tag color="geekblue">{text || "默认部门"}</Tag>,
    },
    {
      title: "关联角色",
      dataIndex: "roleNames",
      search: false,
      render: (_, record) => (
        <Space wrap size={[0, 4]}>
          {(record.roleNames || []).length > 0 ? (
            record.roleNames.map((rn, idx) => (
              <Tag key={idx} color="purple">
                {rn}
              </Tag>
            ))
          ) : (
            <span style={{ color: "#bfbfbf" }}>未分配</span>
          )}
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      search: false,
      render: (_, record) =>
        record.status === 1 ? (
          <Badge status="success" text="正常" />
        ) : (
          <Badge status="error" text="已停用" />
        ),
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      valueType: "dateTime",
      search: false,
    },
    {
      title: "关键字搜索",
      dataIndex: "keyword",
      hideInTable: true,
      fieldProps: {
        placeholder: "用户名 / 姓名 / 手机号",
      },
    },
    {
      title: "操作",
      valueType: "option",
      key: "option",
      render: (_, record) => [
        <Access key="edit" permission={PERMISSIONS.USER_EDIT}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Access>,
        <Access
          key="delete"
          permission={PERMISSIONS.USER_DELETE}
          accessible={record.id !== 1} // 保护超管
          fallbackMode="disabled"
          fallbackTooltip={record.id === 1 ? "超级管理员账号不可删除" : "暂无删除权限"}
        >
          <Popconfirm
            title="删除员工"
            description={`确定要删除员工「${record.realName || record.username}」吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
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
        title: formatMessage({ id: "pages.system.users.title", defaultMessage: "企业员工管理" }),
        subTitle: formatMessage({ id: "pages.system.users.subTitle", defaultMessage: "管理内部员工账号、分配所属部门与系统角色" }),
      }}
    >
      <ProTable<SysUserItem>
        headerTitle="企业员工与账号列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: "auto",
        }}
        toolBarRender={() => [
          <Access key="add" permission={PERMISSIONS.USER_ADD}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建员工
            </Button>
          </Access>,
        ]}
        request={toProTableRequest(systemUsersApi.list)}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <ModalForm
        title={currentRow ? "编辑员工" : "新建员工"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={
          currentRow
            ? {
                ...currentRow,
                roleIds: currentRow.roleIds || [],
              }
            : {
                status: 1,
                deptId: 1,
                roleIds: [],
              }
        }
        onFinish={handleFormSubmit}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="username"
          label="登录账号"
          placeholder="请输入登录账号"
          disabled={!!currentRow}
          rules={[{ required: true, message: "请输入登录账号" }]}
        />
        <ProFormText.Password
          name="password"
          label={currentRow ? "重置密码 (留空则不修改)" : "登录密码"}
          placeholder={currentRow ? "留空则保持原密码" : "请输入初始密码"}
          rules={currentRow ? [] : [{ required: true, message: "请输入登录密码" }]}
        />
        <ProFormText
          name="realName"
          label="真实姓名"
          placeholder="请输入真实姓名"
          rules={[{ required: true, message: "请输入真实姓名" }]}
        />
        <ProFormText
          name="mobile"
          label="手机号码"
          placeholder="请输入11位手机号"
          rules={[{ pattern: /^1\d{10}$/, message: "手机号格式不正确" }]}
        />
        <ProFormText
          name="email"
          label="企业邮箱"
          placeholder="请输入企业邮箱"
          rules={[{ type: "email", message: "邮箱格式不正确" }]}
        />
        <ProFormSelect
          name="roleIds"
          label="分配角色"
          mode="multiple"
          placeholder="请选择员工拥有的角色"
          options={roleOptions}
        />
        <ProFormSelect
          name="status"
          label="账号状态"
          options={[
            { label: "正常启用", value: 1 },
            { label: "封禁停用", value: 0 },
          ]}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default UsersPage;
