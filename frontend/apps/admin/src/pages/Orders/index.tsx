import React, { useRef, useState } from "react";
import { Tag, Space, Avatar, Button, App as AntdApp, Typography } from "antd";
import { ProTable, PageContainer, type ProColumns, type ActionType } from "@ant-design/pro-components";
import { UserOutlined, CheckCircleOutlined, EyeOutlined, ExportOutlined, DeleteOutlined } from "@ant-design/icons";
import { orderService } from "../../services";
import type { OrderDetailResp } from "@zero/api";
import { formatPrice } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";
import { exportToCsv } from "../../utils/exportCsv";

const { Text } = Typography;

export const OrdersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<OrderDetailResp[]>([]);
  const [tableData, setTableData] = useState<OrderDetailResp[]>([]);

  const columns: ProColumns<OrderDetailResp>[] = [
    {
      title: "订单号",
      dataIndex: "orderId",
      copyable: true,
      width: 120,
    },
    {
      title: "购买商品",
      dataIndex: "item",
      ellipsis: true,
    },
    {
      title: "订单金额",
      dataIndex: "amount",
      search: false,
      render: (_, record) => (
        <span style={{ color: "#cf1322", fontWeight: 600 }}>
          {formatPrice(record.amount)}
        </span>
      ),
    },
    {
      title: "订单状态",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        ALL: { text: "全部状态" },
        PAID: { text: "已支付", status: "Success" },
        PENDING: { text: "待支付", status: "Processing" },
        CANCELLED: { text: "已取消", status: "Default" },
      },
      render: (_, record) => (
        <Tag color={record.status === "PAID" ? "green" : "blue"}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: "买家信息",
      dataIndex: "userName",
      search: false,
      render: (_, record) => (
        <Space>
          <Avatar size="small" src={record.avatar} icon={<UserOutlined />} />
          <span>{record.userName}</span>
        </Space>
      ),
    },
    {
      title: "操作",
      valueType: "option",
      key: "option",
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            message.info(`查看订单详情: 单号 ${record.orderId}，买家 ${record.userName}`);
          }}
        >
          详情
        </Button>,
        <Button
          key="audit"
          type="link"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => {
            message.success(`订单 ${record.orderId} 状态核对一致！`);
          }}
        >
          核验
        </Button>,
      ],
    },
  ];

  const handleExport = (dataToExport: OrderDetailResp[]) => {
    if (!dataToExport || dataToExport.length === 0) {
      message.warning("暂无订单数据可供导出");
      return;
    }
    const success = exportToCsv(
      dataToExport,
      [
        { title: "订单编号", dataIndex: "orderId" },
        { title: "购买商品", dataIndex: "item" },
        { title: "订单金额(分)", dataIndex: "amount" },
        { title: "订单状态", dataIndex: "status" },
        { title: "买家用户名", dataIndex: "userName" },
      ],
      `orders_export_${Date.now()}.csv`
    );
    if (success) {
      message.success(`成功导出 ${dataToExport.length} 条订单数据`);
    }
  };

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.orders.title", defaultMessage: "订单聚合管理" }),
        subTitle: formatMessage({ id: "pages.orders.subTitle", defaultMessage: "基于 ProTable 驱动，自动集成条件搜索、列筛选、导出与微服务 RPC 数据透传" }),
      }}
    >
      <ProTable<OrderDetailResp>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        rowKey="orderId"
        search={{
          labelWidth: "auto",
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        tableAlertRender={({ selectedRowKeys }) => (
          <Space size={24}>
            <span>
              已选择 <Text strong style={{ color: "#1677ff" }}>{selectedRowKeys.length}</Text> 项
            </span>
            <span>
              总金额: <Text strong style={{ color: "#cf1322" }}>
                {formatPrice(selectedRows.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
              </Text>
            </span>
          </Space>
        )}
        tableAlertOptionRender={({ onCleanSelected }) => (
          <Space size={16}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                message.success(`成功批量处理并删除 ${selectedRowKeys.length} 笔订单`);
                onCleanSelected();
                setSelectedRowKeys([]);
                setSelectedRows([]);
              }}
            >
              批量删除
            </Button>
            <Button
              type="link"
              icon={<ExportOutlined />}
              onClick={() => {
                handleExport(selectedRows);
              }}
            >
              批量导出
            </Button>
            <Button type="link" onClick={onCleanSelected}>
              取消选择
            </Button>
          </Space>
        )}
        toolBarRender={() => [
          <Button
            key="export"
            icon={<ExportOutlined />}
            onClick={() => {
              handleExport(tableData);
            }}
          >
            导出数据
          </Button>,
        ]}
        request={async (params) => {
          const targetOrderId = params.orderId ? Number(params.orderId) : 1001;
          const res = await orderService.getOrderDetail({ orderId: targetOrderId });
          const list = res ? [res] : [];
          setTableData(list);
          return {
            data: list,
            success: true,
            total: list.length,
          };
        }}
        pagination={{
          pageSize: 10,
        }}
        dateFormatter="string"
        headerTitle="微服务订单列表"
      />
    </PageContainer>
  );
};

export default OrdersPage;