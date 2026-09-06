import React, { useRef, useState, useEffect } from "react";
import {
  App as AntdApp,
  Button,
  Space,
  Tag,
  Popconfirm,
  Badge,
  Row,
  Col,
  Card,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  ReloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormRadio,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  listSysDictTypes,
  createSysDictType,
  updateSysDictType,
  deleteSysDictType,
  listSysDictData,
  createSysDictData,
  updateSysDictData,
  deleteSysDictData,
  type SysDictTypeItem,
  type SysDictDataItem,
} from "@zero/api";
import { PERMISSIONS } from "@zero/shared";
import { Access } from "../../../components/Access";
import { clearDictCache } from "../../../hooks/useDict";

const { Text } = Typography;

const TAG_COLOR_OPTIONS = [
  { label: "绿色 / 成功 (success)", value: "success" },
  { label: "蓝色 / 处理中 (processing)", value: "processing" },
  { label: "橙色 / 警告 (warning)", value: "warning" },
  { label: "红色 / 危险 (error)", value: "error" },
  { label: "灰色 / 默认 (default)", value: "default" },
  { label: "科技蓝 (blue)", value: "blue" },
  { label: "紫罗兰 (purple)", value: "purple" },
  { label: "青翠绿 (cyan)", value: "cyan" },
  { label: "活力橙 (orange)", value: "orange" },
  { label: "品红色 (magenta)", value: "magenta" },
];

export const DictsPage: React.FC = () => {
  const { message } = AntdApp.useApp();

  // 左右两个表格的 actionRef
  const typeActionRef = useRef<ActionType>(null);
  const dataActionRef = useRef<ActionType>(null);

  // 当前选中的字典类型
  const [selectedType, setSelectedType] = useState<SysDictTypeItem | null>(null);

  // 字典类型弹窗
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [currentTypeRow, setCurrentTypeRow] = useState<SysDictTypeItem | null>(null);

  // 字典数据项弹窗
  const [dataModalVisible, setDataModalVisible] = useState(false);
  const [currentDataRow, setCurrentDataRow] = useState<SysDictDataItem | null>(null);

  // -------------------------------------------------------------
  // 字典类型操作
  // -------------------------------------------------------------
  const handleAddType = () => {
    setCurrentTypeRow(null);
    setTypeModalVisible(true);
  };

  const handleEditType = (record: SysDictTypeItem) => {
    setCurrentTypeRow(record);
    setTypeModalVisible(true);
  };

  const handleDeleteType = async (id: number, dictType: string) => {
    try {
      await deleteSysDictType({}, id);
      message.success("字典类型删除成功");
      clearDictCache(dictType);
      if (selectedType?.id === id) {
        setSelectedType(null);
      }
      typeActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "删除失败");
    }
  };

  const handleTypeFormSubmit = async (values: any) => {
    try {
      if (currentTypeRow) {
        await updateSysDictType({
          id: currentTypeRow.id,
          dictName: values.dictName,
          dictType: values.dictType,
          status: values.status ?? 1,
          remark: values.remark || "",
        });
        message.success("更新字典类型成功");
        clearDictCache(currentTypeRow.dictType);
        clearDictCache(values.dictType);
      } else {
        await createSysDictType({
          dictName: values.dictName,
          dictType: values.dictType,
          status: values.status ?? 1,
          remark: values.remark || "",
        });
        message.success("创建字典类型成功");
      }
      setTypeModalVisible(false);
      typeActionRef.current?.reload();
      return true;
    } catch (err: any) {
      message.error(err.message || "操作失败");
      return false;
    }
  };

  // -------------------------------------------------------------
  // 字典数据项操作
  // -------------------------------------------------------------
  const handleAddData = () => {
    if (!selectedType) {
      message.warning("请先在左侧选择一个字典类型");
      return;
    }
    setCurrentDataRow(null);
    setDataModalVisible(true);
  };

  const handleEditData = (record: SysDictDataItem) => {
    setCurrentDataRow(record);
    setDataModalVisible(true);
  };

  const handleDeleteData = async (id: number) => {
    try {
      await deleteSysDictData({}, id);
      message.success("字典数据项删除成功");
      if (selectedType) {
        clearDictCache(selectedType.dictType);
      }
      dataActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.message || "删除失败");
    }
  };

  const handleDataFormSubmit = async (values: any) => {
    if (!selectedType) return false;
    try {
      if (currentDataRow) {
        await updateSysDictData({
          id: currentDataRow.id,
          dictType: selectedType.dictType,
          dictLabel: values.dictLabel,
          dictValue: values.dictValue,
          dictSort: values.dictSort ?? 0,
          listClass: values.listClass || "",
          isDefault: values.isDefault ?? 0,
          status: values.status ?? 1,
          remark: values.remark || "",
        });
        message.success("更新字典数据项成功");
      } else {
        await createSysDictData({
          dictType: selectedType.dictType,
          dictLabel: values.dictLabel,
          dictValue: values.dictValue,
          dictSort: values.dictSort ?? 0,
          listClass: values.listClass || "",
          isDefault: values.isDefault ?? 0,
          status: values.status ?? 1,
          remark: values.remark || "",
        });
        message.success("创建字典数据项成功");
      }
      clearDictCache(selectedType.dictType);
      setDataModalVisible(false);
      dataActionRef.current?.reload();
      return true;
    } catch (err: any) {
      message.error(err.message || "操作失败");
      return false;
    }
  };

  // -------------------------------------------------------------
  // 表格列定义
  // -------------------------------------------------------------
  const typeColumns: ProColumns<SysDictTypeItem>[] = [
    {
      title: "字典名称",
      dataIndex: "dictName",
      render: (dom, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong style={{ color: selectedType?.id === record.id ? "#1677ff" : undefined }}>
            {record.dictName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.dictType}
          </Text>
        </Space>
      ),
    },
    {
      title: "类型标识",
      dataIndex: "dictType",
      hideInTable: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 80,
      valueEnum: {
        1: { text: "正常", status: "Success" },
        0: { text: "停用", status: "Error" },
      },
    },
    {
      title: "操作",
      valueType: "option",
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<RightOutlined />}
            onClick={() => setSelectedType(record)}
          >
            {selectedType?.id === record.id ? "已选" : "项"}
          </Button>
          <Access permission={PERMISSIONS.DICT_TYPE_EDIT}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditType(record)}
            />
          </Access>
          <Access permission={PERMISSIONS.DICT_TYPE_DELETE}>
            <Popconfirm
              title="确定删除该字典类型吗？"
              description="删除后不可恢复，请确保其下无关联数据项"
              onConfirm={() => handleDeleteType(record.id, record.dictType)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  const dataColumns: ProColumns<SysDictDataItem>[] = [
    {
      title: "标签文本",
      dataIndex: "dictLabel",
      render: (_, record) => {
        const color = record.listClass || "default";
        return (
          <Tag color={color} style={{ fontWeight: 500 }}>
            {record.dictLabel}
          </Tag>
        );
      },
    },
    {
      title: "字典键值",
      dataIndex: "dictValue",
      copyable: true,
    },
    {
      title: "回显样式",
      dataIndex: "listClass",
      search: false,
      render: (text) => (text ? <Text code>{String(text)}</Text> : "-"),
    },
    {
      title: "排序",
      dataIndex: "dictSort",
      width: 70,
      search: false,
    },
    {
      title: "默认",
      dataIndex: "isDefault",
      width: 70,
      search: false,
      render: (val) =>
        val === 1 ? <Badge status="processing" text="是" /> : <Text type="secondary">否</Text>,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 80,
      valueEnum: {
        1: { text: "正常", status: "Success" },
        0: { text: "停用", status: "Error" },
      },
    },
    {
      title: "操作",
      valueType: "option",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Access permission={PERMISSIONS.DICT_DATA_EDIT}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditData(record)}
            />
          </Access>
          <Access permission={PERMISSIONS.DICT_DATA_DELETE}>
            <Popconfirm
              title="确定删除此数据项吗？"
              onConfirm={() => handleDeleteData(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16}>
        {/* 左侧：字典分类列表 */}
        <Col xs={24} md={10}>
          <ProTable<SysDictTypeItem>
            headerTitle={
              <Space>
                <BookOutlined style={{ color: "#1677ff" }} />
                <span>字典类型列表</span>
              </Space>
            }
            actionRef={typeActionRef}
            rowKey="id"
            search={{
              labelWidth: "auto",
              filterType: "query",
            }}
            toolBarRender={() => [
              <Access key="add" permission={PERMISSIONS.DICT_TYPE_ADD}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddType}>
                  新增类型
                </Button>
              </Access>,
            ]}
            request={async (params) => {
              const res = await listSysDictTypes({
                page: params.current || 1,
                pageSize: params.pageSize || 10,
                keyword: params.dictName || params.dictType,
                status: params.status ? Number(params.status) : undefined,
              });
              // 若没有选中的类型，默认选中列表首项
              if (!selectedType && res.list && res.list.length > 0) {
                setSelectedType(res.list[0]);
              }
              return {
                data: res.list || [],
                success: true,
                total: res.total || 0,
              };
            }}
            columns={typeColumns}
            rowClassName={(record) =>
              selectedType?.id === record.id ? "ant-table-row-selected" : ""
            }
            onRow={(record) => ({
              onClick: () => setSelectedType(record),
              style: { cursor: "pointer" },
            })}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
            }}
          />
        </Col>

        {/* 右侧：字典数据项明细 */}
        <Col xs={24} md={14}>
          <ProTable<SysDictDataItem>
            headerTitle={
              selectedType ? (
                <Space>
                  <span>
                    数据项：
                    <Text strong style={{ color: "#1677ff" }}>
                      {selectedType.dictName}
                    </Text>
                  </span>
                  <Text code>{selectedType.dictType}</Text>
                </Space>
              ) : (
                "请选择字典类型查看明细"
              )
            }
            actionRef={dataActionRef}
            params={{ dictType: selectedType?.dictType }}
            rowKey="id"
            search={{
              labelWidth: "auto",
              filterType: "query",
            }}
            toolBarRender={() => [
              <Access key="addData" permission={PERMISSIONS.DICT_DATA_ADD}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!selectedType}
                  onClick={handleAddData}
                >
                  新增数据项
                </Button>
              </Access>,
              <Button
                key="reload"
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (selectedType) {
                    clearDictCache(selectedType.dictType);
                  }
                  dataActionRef.current?.reload();
                }}
              >
                刷新
              </Button>,
            ]}
            request={async (params) => {
              if (!params.dictType) {
                return { data: [], success: true, total: 0 };
              }
              const res = await listSysDictData({
                page: params.current || 1,
                pageSize: params.pageSize || 10,
                dictType: params.dictType,
                keyword: params.dictLabel || params.dictValue,
                status: params.status ? Number(params.status) : undefined,
              });
              return {
                data: res.list || [],
                success: true,
                total: res.total || 0,
              };
            }}
            columns={dataColumns}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
            }}
          />
        </Col>
      </Row>

      {/* 字典类型新建/编辑弹窗 */}
      <ModalForm
        title={currentTypeRow ? "编辑字典类型" : "新增字典类型"}
        open={typeModalVisible}
        onOpenChange={setTypeModalVisible}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          currentTypeRow || {
            status: 1,
          }
        }
        onFinish={handleTypeFormSubmit}
      >
        <ProFormText
          name="dictName"
          label="字典中文名称"
          placeholder="如：订单交易状态、用户性别"
          rules={[{ required: true, message: "请输入字典名称" }]}
        />
        <ProFormText
          name="dictType"
          label="字典类型标识"
          placeholder="如：order_status、sys_user_sex (全英文与下划线)"
          rules={[
            { required: true, message: "请输入字典类型标识" },
            {
              pattern: /^[a-z0-9_]+$/,
              message: "只允许包含小写英文字母、数字和下划线",
            },
          ]}
        />
        <ProFormRadio.Group
          name="status"
          label="状态"
          options={[
            { label: "正常", value: 1 },
            { label: "停用", value: 0 },
          ]}
        />
        <ProFormTextArea
          name="remark"
          label="备注说明"
          placeholder="请输入该数据字典的使用场景或业务定义"
        />
      </ModalForm>

      {/* 字典数据项新建/编辑弹窗 */}
      <ModalForm
        title={currentDataRow ? "编辑字典数据项" : "新增字典数据项"}
        open={dataModalVisible}
        onOpenChange={setDataModalVisible}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          currentDataRow
            ? {
                ...currentDataRow,
                dictType: selectedType?.dictType,
              }
            : {
                dictType: selectedType?.dictType,
                dictSort: 1,
                isDefault: 0,
                status: 1,
                listClass: "default",
              }
        }
        onFinish={handleDataFormSubmit}
      >
        <ProFormText
          name="dictType"
          label="所属字典类型"
          disabled
        />
        <ProFormText
          name="dictLabel"
          label="数据标签文本"
          placeholder="如：待支付、男性、正常"
          rules={[{ required: true, message: "请输入数据标签" }]}
        />
        <ProFormText
          name="dictValue"
          label="数据键值 (Value)"
          placeholder="如：PENDING、1、active"
          rules={[{ required: true, message: "请输入数据键值" }]}
        />
        <ProFormSelect
          name="listClass"
          label="回显标签样式"
          options={TAG_COLOR_OPTIONS}
          placeholder="请选择渲染色彩或预设风格"
        />
        <ProFormDigit
          name="dictSort"
          label="排序权重"
          min={0}
          max={9999}
          placeholder="数字越小越靠前"
        />
        <ProFormRadio.Group
          name="isDefault"
          label="是否默认项"
          options={[
            { label: "否", value: 0 },
            { label: "是", value: 1 },
          ]}
        />
        <ProFormRadio.Group
          name="status"
          label="状态"
          options={[
            { label: "正常", value: 1 },
            { label: "停用", value: 0 },
          ]}
        />
        <ProFormTextArea
          name="remark"
          label="备注说明"
          placeholder="该枚举值的补充说明"
        />
      </ModalForm>
    </div>
  );
};

export default DictsPage;
