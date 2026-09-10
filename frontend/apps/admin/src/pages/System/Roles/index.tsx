import React, { useRef, useState } from "react";
import {
  App as AntdApp,
  Button,
  Space,
  Tag,
  Popconfirm,
  Badge,
  Drawer,
  Tree,
  Card,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  systemRolesApi,
  systemMenusApi,
  toProTableRequest,
} from "../../../services";
import type { SysRoleItem, SysMenuItem } from "@zero/api";
import { PERMISSIONS } from "@zero/shared";
import { Access } from "../../../components/Access";
import { useIntl } from "../../../contexts/LocaleContext";

export const RolesPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysRoleItem | null>(null);

  // 权限分配抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<SysRoleItem | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [menuTreeData, setMenuTreeData] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // 递归转换菜单树为 Ant Design Tree 格式
  const formatTreeData = (items: SysMenuItem[]): any[] => {
    return (items || []).map((item) => {
      const typeTag =
        item.type === 1 ? (
          <Tag color="blue">目录</Tag>
        ) : item.type === 2 ? (
          <Tag color="green">菜单</Tag>
        ) : (
          <Tag color="orange">按钮</Tag>
        );

      return {
        key: item.id,
        title: (
          <Space>
            <span>{item.title}</span>
            {typeTag}
            {item.permissionCode && (
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                ({item.permissionCode})
              </span>
            )}
          </Space>
        ),
        children: item.children && item.children.length > 0 ? formatTreeData(item.children) : undefined,
      };
    });
  };

  const openPermissionDrawer = async (role: SysRoleItem) => {
    setCurrentRole(role);
    setCheckedKeys(role.menuIds || []);
    setDrawerVisible(true);
    setTreeLoading(true);

    try {
      const res = await systemMenusApi.getTree();
      setMenuTreeData(formatTreeData(res.list || []));
    } finally {
      setTreeLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!currentRole) return;
    setAssignLoading(true);
    try {
      const menuIds = checkedKeys.map((k) => Number(k));
      await systemRolesApi.assignPermissions({
        roleId: currentRole.id,
        menuIds,
      });
      message.success("角色权限已成功分配并级联同步接口字典！");
      setDrawerVisible(false);
      actionRef.current?.reload();
    } finally {
      setAssignLoading(false);
    }
  };

  const handleEdit = (record: SysRoleItem) => {
    setCurrentRow(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRow(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await systemRolesApi.remove({}, id);
    message.success("角色删除成功");
    actionRef.current?.reload();
  };

  const handleFormSubmit = async (values: any) => {
    if (currentRow) {
      await systemRolesApi.update({
        id: currentRow.id,
        name: values.name,
        code: values.code,
        sort: values.sort ?? 0,
        dataScope: values.dataScope ?? 1,
        description: values.description || "",
        status: values.status ?? 1,
      });
      message.success("更新角色信息成功");
    } else {
      await systemRolesApi.create({
        name: values.name,
        code: values.code,
        sort: values.sort ?? 0,
        dataScope: values.dataScope ?? 1,
        description: values.description || "",
      });
      message.success("创建角色成功");
    }
    setModalVisible(false);
    actionRef.current?.reload();
    return true;
  };

  const dataScopeMap: Record<number, { text: string; color: string }> = {
    1: { text: "全部数据权限", color: "red" },
    2: { text: "本部门及以下", color: "blue" },
    3: { text: "本部门数据", color: "cyan" },
    4: { text: "仅本人数据", color: "default" },
  };

  const columns: ProColumns<SysRoleItem>[] = [
    {
      title: "角色名称",
      dataIndex: "name",
      render: (text, record) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: "#1677ff" }} />
          <span style={{ fontWeight: 600 }}>{text}</span>
          {record.code === "ROLE_ADMIN" && <Tag color="gold">系统超管</Tag>}
        </Space>
      ),
    },
    {
      title: "角色标识 (Code)",
      dataIndex: "code",
      copyable: true,
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "数据权限范围",
      dataIndex: "dataScope",
      search: false,
      render: (_, record) => {
        const item = dataScopeMap[record.dataScope ?? 1] || {
          text: "自定义权限",
          color: "default",
        };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: "排序",
      dataIndex: "sort",
      search: false,
      width: 80,
    },
    {
      title: "状态",
      dataIndex: "status",
      search: false,
      render: (_, record) =>
        record.status === 1 ? (
          <Badge status="success" text="启用" />
        ) : (
          <Badge status="error" text="停用" />
        ),
    },
    {
      title: "描述说明",
      dataIndex: "description",
      search: false,
      ellipsis: true,
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
        placeholder: "角色名称 / 角色标识",
      },
    },
    {
      title: "操作",
      valueType: "option",
      key: "option",
      render: (_, record) => [
        <Access key="assign" permission={PERMISSIONS.ROLE_ASSIGN}>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => openPermissionDrawer(record)}
          >
            分配权限
          </Button>
        </Access>,
        <Access key="edit" permission={PERMISSIONS.ROLE_EDIT}>
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
          permission={PERMISSIONS.ROLE_DELETE}
          accessible={record.code !== "ROLE_ADMIN" && record.code !== "admin"}
          fallbackMode="disabled"
          fallbackTooltip="超级管理员角色禁止删除"
        >
          <Popconfirm
            title="删除角色"
            description={`确定要删除角色「${record.name}」吗？`}
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
        title: formatMessage({ id: "pages.system.roles.title", defaultMessage: "系统角色与权限" }),
        subTitle: formatMessage({ id: "pages.system.roles.subTitle", defaultMessage: "基于 RBAC 动态分配菜单权限与底层 API 访问权限" }),
      }}
    >
      <ProTable<SysRoleItem>
        headerTitle="系统角色列表"
        actionRef={actionRef}
        rowKey="id"
        columnsState={{
          persistenceKey: "pro-table-columns-system-roles",
          persistenceType: "localStorage",
        }}
        search={{
          labelWidth: "auto",
        }}
        toolBarRender={() => [
          <Access key="add" permission={PERMISSIONS.ROLE_ADD}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建角色
            </Button>
          </Access>,
        ]}
        request={toProTableRequest(systemRolesApi.list)}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      {/* 角色编辑与新建 Modal */}
      <ModalForm
        title={currentRow ? "编辑角色" : "新建角色"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        autoFocusFirstInput
        initialValues={
          currentRow || {
            sort: 1,
            dataScope: 1,
            status: 1,
          }
        }
        onFinish={handleFormSubmit}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="name"
          label="角色名称"
          placeholder="例如: 财务专员"
          rules={[{ required: true, message: "请输入角色名称" }]}
        />
        <ProFormText
          name="code"
          label="角色标识 (Role Code)"
          placeholder="例如: ROLE_FINANCE"
          disabled={currentRow?.code === "ROLE_ADMIN" || currentRow?.code === "admin"}
          rules={[{ required: true, message: "请输入角色标识" }]}
        />
        <ProFormSelect
          name="dataScope"
          label="数据权限范围"
          options={[
            { label: "全部数据权限", value: 1 },
            { label: "本部门及以下数据权限", value: 2 },
            { label: "本部门数据权限", value: 3 },
            { label: "仅本人数据权限", value: 4 },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormDigit
          name="sort"
          label="显示排序"
          min={0}
          max={9999}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="status"
          label="角色状态"
          options={[
            { label: "正常启用", value: 1 },
            { label: "禁用停用", value: 0 },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText
          name="description"
          label="描述备注"
          placeholder="请输入角色的职责描述"
        />
      </ModalForm>

      {/* 权限分配抽屉 */}
      <Drawer
        title={
          <Space>
            <KeyOutlined style={{ color: "#1677ff" }} />
            <span>为角色「{currentRole?.name}」分配菜单与按钮权限</span>
          </Space>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size={540}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button
              type="primary"
              loading={assignLoading}
              onClick={handleSavePermissions}
            >
              保存权限分配
            </Button>
          </Space>
        }
      >
        <Card variant="borderless" style={{ background: "#fafafa", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#595959" }}>
            勾选目录、页面或按钮权限点后，系统将通过原子事务闭环同步更新该角色关联的菜单树及底层后端 API 访问控制列表。
          </div>
        </Card>
        {treeLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin description="正在加载权限树..." />
          </div>
        ) : (
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedKeys}
            onCheck={(keys) => {
              if (Array.isArray(keys)) {
                setCheckedKeys(keys);
              } else {
                setCheckedKeys(keys.checked);
              }
            }}
            treeData={menuTreeData}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default RolesPage;
