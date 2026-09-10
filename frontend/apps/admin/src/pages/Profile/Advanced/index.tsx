import React from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Space,
  Statistic,
  Steps,
  Tag,
  Typography,
  Badge,
  Flex,
} from "antd";
import {
  PageContainer,
  ProCard,
  ProDescriptions,
  ProTable,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@zero/shared";

const { Text } = Typography;

export const AdvancedProfilePage: React.FC = () => {
  const { message } = AntdApp.useApp();

  const goodsColumns: ProColumns[] = [
    { title: "商品编号", dataIndex: "id", width: 100 },
    { title: "商品名称", dataIndex: "name" },
    { title: "条形码", dataIndex: "barcode" },
    {
      title: "单价",
      dataIndex: "price",
      render: (_, r) => formatPrice(r.price),
    },
    { title: "数量（件）", dataIndex: "num" },
    {
      title: "金额",
      dataIndex: "amount",
      render: (_, r) => <Text strong>{formatPrice(r.amount)}</Text>,
    },
  ];

  const goodsData = [
    { id: "10001", name: "微服务架构企业授权套件 (旗舰版)", barcode: "6901234567890", price: 12800, num: 1, amount: 12800 },
    { id: "10002", name: "分布式事务协同引擎中间件", barcode: "6901234567891", price: 3600, num: 2, amount: 7200 },
    { id: "10003", name: "自动化 CI/CD 与全链路性能监控探针", barcode: "6901234567892", price: 2400, num: 1, amount: 2400 },
  ];

  const logColumns: ProColumns[] = [
    { title: "操作时间", dataIndex: "time", width: 180 },
    { title: "操作人", dataIndex: "operator", width: 120 },
    {
      title: "执行动作",
      dataIndex: "action",
      render: (_, r) => <Tag color="blue">{r.action}</Tag>,
    },
    {
      title: "处理结果",
      dataIndex: "status",
      render: (_, r) => (
        <Badge
          status={r.status === "SUCCESS" ? "success" : "processing"}
          text={r.status === "SUCCESS" ? "成功" : "进行中"}
        />
      ),
    },
    { title: "备注与审计说明", dataIndex: "memo" },
  ];

  const logData = [
    { id: 1, time: "2026-09-10 07:15:30", operator: "超级管理员", action: "创建订单", status: "SUCCESS", memo: "客户发起企业级框架采购申请" },
    { id: 2, time: "2026-09-10 07:22:10", operator: "风控系统", action: "自动合规校验", status: "SUCCESS", memo: "反洗钱与资质三要素审核通过" },
    { id: 3, time: "2026-09-10 07:35:45", operator: "财务负责人", action: "部门复核", status: "PROCESSING", memo: "款项已入账，等待最终发货授权" },
  ];

  return (
    <PageContainer
      title="单号：ORDER-20260910-8888"
      extra={[
        <Button key="1" onClick={() => message.info("操作已记录")}>
          导出单据
        </Button>,
        <Button key="2" onClick={() => message.info("单据已流转下一节点")}>
          催办审核
        </Button>,
        <Button key="3" type="primary" onClick={() => message.success("单据审核通过")}>
          确认审批通过
        </Button>,
      ]}
      content={
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="申请人">张三架构师</Descriptions.Item>
          <Descriptions.Item label="所属部门">基础架构研发中心</Descriptions.Item>
          <Descriptions.Item label="创建时间">2026-09-10 07:10:00</Descriptions.Item>
          <Descriptions.Item label="关联合同">HT-MICROSERVICE-2026-A</Descriptions.Item>
          <Descriptions.Item label="交付生效期">2026-09-10 至 2027-09-10</Descriptions.Item>
          <Descriptions.Item label="优先级"><Tag color="red">P0 紧急</Tag></Descriptions.Item>
        </Descriptions>
      }
      extraContent={
        <Space size={32}>
          <Statistic title="单据状态" value="财务复核中" styles={{ content: { color: "#1677ff", fontSize: 20 } }} />
          <Statistic title="订单总金额" value={22400} prefix="￥" precision={2} styles={{ content: { color: "#cf1322", fontSize: 22 } }} />
        </Space>
      }
    >
      <Flex vertical gap={16} style={{ width: "100%" }}>
        {/* 流程进度 */}
        <ProCard title="单据流转全生命周期状态" headerBordered>
          <Steps
            current={2}
            items={[
              { title: "提交申请", description: "2026-09-10 07:10", status: "finish" },
              { title: "技术合规审查", description: "通过 (耗时 5m)", status: "finish" },
              { title: "财务款项复核", description: "复核中 (财务部)", status: "process", icon: <LoadingOutlined /> },
              { title: "完成交付授权", description: "待执行", status: "wait" },
            ]}
          />
        </ProCard>

        {/* 详细概览 */}
        <ProCard title="客户与商务明细" headerBordered>
          <ProDescriptions column={{ xs: 1, sm: 2, md: 3 }}>
            <ProDescriptions.Item label="客户单位">某国际金融科技集团</ProDescriptions.Item>
            <ProDescriptions.Item label="联系人电话">188-8888-9999</ProDescriptions.Item>
            <ProDescriptions.Item label="支付方式">银行大额转账</ProDescriptions.Item>
            <ProDescriptions.Item label="纳税人识别号">91110108MA0000000X</ProDescriptions.Item>
            <ProDescriptions.Item label="发票开具类型">增值税专用发票 (13%)</ProDescriptions.Item>
            <ProDescriptions.Item label="企业开户行">招商银行北京分行金融街支行</ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>

        {/* 商品清单 */}
        <ProCard title="订购清单明细" headerBordered>
          <ProTable
            columns={goodsColumns}
            dataSource={goodsData}
            rowKey="id"
            search={false}
            pagination={false}
            options={false}
          />
        </ProCard>

        {/* 操作审计流 */}
        <ProCard title="操作审计流转历史" headerBordered>
          <ProTable
            columns={logColumns}
            dataSource={logData}
            rowKey="id"
            search={false}
            pagination={false}
            options={false}
          />
        </ProCard>
      </Flex>
    </PageContainer>
  );
};

export default AdvancedProfilePage;
