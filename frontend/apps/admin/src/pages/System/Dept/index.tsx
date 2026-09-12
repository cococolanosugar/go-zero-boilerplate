import React, { useRef, useState, useMemo } from "react";
import {
  Space,
  Button,
  Tag,
  Popconfirm,
  TreeSelect,
  App,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  DownOutlined,
  RightOutlined,
  SubnodeOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormRadio,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  listSysDept,
  createSysDept,
  updateSysDept,
  deleteSysDept,
  type SysDeptItem,
} from "@zero/api";
import { Access } from "../../../components/Access";
import { useIntl } from "../../../contexts/LocaleContext";

export const DeptPage: React.FC = () => {
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<SysDeptItem | null>(null);
  const [parentDeptId, setParentDeptId] = useState<number>(0);
  const [rawDeptTree, setRawDeptTree] = useState<SysDeptItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  // 递归收集所有节点的 Key 用于一键展开
  const getAllKeys = (items: SysDeptItem[]): React.Key[] => {
    let keys: React.Key[] = [];
    for (const item of items) {
      keys.push(item.id);
      if (item.children && item.children.length > 0) {
        keys = keys.concat(getAllKeys(item.children));
      }
    }
    return keys;
  };

  const handleExpandAll = () => {
    if (expandedKeys.length > 0) {
      setExpandedKeys([]);
    } else {
      setExpandedKeys(getAllKeys(rawDeptTree));
    }
  };

  const handleAdd = (parentId: number = 0) => {
    setCurrentRow(null);
    setParentDeptId(parentId);
    setModalVisible(true);
  };

  const handleEdit = (record: SysDeptItem) => {
    setCurrentRow(record);
    setParentDeptId(record.parentId);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSysDept({}, id);
      message.success(formatMessage({ id: "common.deleteSuccess", defaultMessage: "删除成功" }));
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "删除失败");
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const payload = {
        deptName: values.deptName,
        parentId: Number(parentDeptId) || 0,
        sort: Number(values.sort) || 1,
        leader: values.leader || "",
        phone: values.phone || "",
        status: Number(values.status) ?? 1,
      };

      if (currentRow && currentRow.id) {
        await updateSysDept({ ...payload, id: currentRow.id });
        message.success(formatMessage({ id: "common.updateSuccess", defaultMessage: "更新成功" }));
      } else {
        await createSysDept(payload);
        message.success(formatMessage({ id: "common.createSuccess", defaultMessage: "创建成功" }));
      }
      setModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (err: any) {
      message.error(err.message || "操作失败");
      return false;
    }
  };

  // 构建 TreeSelect 数据源，如果是编辑模式，将当前节点及其所有子孙节点设为 disabled，防止自环
  const treeSelectData = useMemo(() => {
    const disableDescendants = (nodes: SysDeptItem[], disable: boolean): any[] => {
      return nodes.map((node) => {
        const isSelf = currentRow ? node.id === currentRow.id : false;
        const shouldDisable = disable || isSelf;
        return {
          title: node.deptName,
          value: node.id,
          key: node.id,
          disabled: shouldDisable,
          children: node.children && node.children.length > 0 ? disableDescendants(node.children, shouldDisable) : undefined,
        };
      });
    };

    return [
      {
        title: "顶级部门 (根节点)",
        value: 0,
        key: 0,
        children: disableDescendants(rawDeptTree, false),
      },
    ];
  }, [rawDeptTree, currentRow]);

  const columns: ProColumns<SysDeptItem>[] = [
    {
      title: "部门名称",
      dataIndex: "deptName",
      width: 260,
      render: (_, record) => (
        <Space>
          <ApartmentOutlined style={{ color: "#1677ff" }} />
          <span style={{ fontWeight: record.parentId === 0 ? 600 : 400 }}>
            {record.deptName}
          </span>
        </Space>
      ),
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 80,
      search: false,
    },
    {
      title: "负责人",
      dataIndex: "leader",
      width: 120,
      render: (text) => text || <span style={{ color: "#bfbfbf" }}>-</span>,
    },
    {
      title: "联系电话",
      dataIndex: "phone",
      width: 140,
      render: (text) => text || <span style={{ color: "#bfbfbf" }}>-</span>,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      valueType: "select",
      valueEnum: {
        "-1": { text: "全部", status: "Default" },
        1: { text: "正常", status: "Success" },
        0: { text: "停用", status: "Error" },
      },
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="success">正常</Tag>
        ) : (
          <Tag color="error">停用</Tag>
        ),
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 170,
      search: false,
    },
    {
      title: "操作",
      valueType: "option",
      width: 200,
      render: (_, record) => [
        <Access key="addSub" permission="system:dept:add">
          <Button
            type="link"
            size="small"
            icon={<SubnodeOutlined />}
            onClick={() => handleAdd(record.id)}
          >
            新增下级
          </Button>
        </Access>,
        <Access key="edit" permission="system:dept:edit">
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
          key="del"
          permission="system:dept:delete"
          fallbackMode="disabled"
          fallbackTooltip="暂无删除部门权限"
        >
          <Popconfirm
            title="确认删除该部门？"
            description="如果该部门下存在子部门或员工，系统将拒绝删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
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
        title: "部门管理",
        subTitle: "维护企业组织机构层级树、负责人、联系方式与启停状态",
      }}
    >
      <ProTable<SysDeptItem>
        headerTitle="组织机构部门树"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: "auto",
        }}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
        }}
        toolBarRender={() => [
          <Button
            key="expand"
            onClick={handleExpandAll}
            icon={expandedKeys.length > 0 ? <RightOutlined /> : <DownOutlined />}
          >
            {expandedKeys.length > 0 ? "全部折叠" : "全部展开"}
          </Button>,
          <Access key="addRoot" permission="system:dept:add">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAdd(0)}
            >
              新建根部门
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          try {
            const res = await listSysDept({
              keyword: params.deptName,
              status: params.status !== undefined && params.status !== "-1" ? Number(params.status) : undefined,
            });
            const list = res.list || [];
            setRawDeptTree(list);
            // 首次加载默认全部展开
            if (expandedKeys.length === 0 && list.length > 0) {
              setExpandedKeys(getAllKeys(list));
            }
            return {
              data: list,
              success: true,
            };
          } catch (err: any) {
            message.error(err.message || "获取部门列表失败");
            return {
              data: [],
              success: false,
            };
          }
        }}
        columns={columns}
        pagination={false}
      />

      <ModalForm
        title={currentRow ? "编辑部门" : parentDeptId === 0 ? "新建根部门" : "新增下级部门"}
        open={modalVisible}
        onOpenChange={setModalVisible}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          currentRow
            ? {
                ...currentRow,
                status: currentRow.status ?? 1,
              }
            : {
                sort: 1,
                status: 1,
              }
        }
        onFinish={handleFormSubmit}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            <span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>上级部门:
          </div>
          <TreeSelect
            style={{ width: "100%" }}
            value={parentDeptId}
            treeData={treeSelectData}
            styles={{ popup: { root: { maxHeight: 400, overflow: "auto" } } }}
            placeholder="请选择上级部门"
            treeDefaultExpandAll
            onChange={(val) => setParentDeptId(val as number)}
          />
        </div>

        <ProFormText
          name="deptName"
          label="部门名称"
          placeholder="请输入部门名称"
          rules={[{ required: true, message: "请输入部门名称" }]}
        />

        <ProFormDigit
          name="sort"
          label="显示顺序"
          min={1}
          max={9999}
          initialValue={1}
          rules={[{ required: true, message: "请输入显示排序" }]}
        />

        <ProFormText
          name="leader"
          label="负责人"
          placeholder="请输入部门负责人姓名"
        />

        <ProFormText
          name="phone"
          label="联系电话"
          placeholder="请输入联系电话"
        />

        <ProFormRadio.Group
          name="status"
          label="部门状态"
          initialValue={1}
          options={[
            { label: "正常", value: 1 },
            { label: "停用", value: 0 },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default DeptPage;
