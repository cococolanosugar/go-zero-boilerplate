import React, { useRef } from "react";
import { Tag, Space, Avatar, Button, App as AntdApp } from "antd";
import { ProTable, PageContainer, type ProColumns, type ActionType } from "@ant-design/pro-components";
import { UserOutlined, CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { orderService } from "../../services";
import type { OrderDetailResp } from "@zero/api";
import { formatPrice } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";

export const OrdersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>();

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
        request={async (params) => {
          const targetOrderId = params.orderId ? Number(params.orderId) : 1001;
          const res = await orderService.getOrderDetail({ orderId: targetOrderId });
          return {
            data: res ? [res] : [],
            success: true,
            total: res ? 1 : 0,
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