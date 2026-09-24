import React, { useState, useRef } from "react";
import {
  Space,
  Button,
  Tag,
  Modal,
  Input,
  Drawer,
  Descriptions,
  Typography,
  App,
  Card,
  Row,
  Col,
  Statistic,
  Grid,
} from "antd";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useProject } from "../../contexts/ProjectContext";
import { StatusBadge } from "../../components/StatusBadge";
import {
  listReleaseOrders,
  auditReleaseOrder,
  executeReleaseOrder,
  type ReleaseOrderVO,
} from "@zero/api";
import { CreateReleaseDrawer } from "./CreateReleaseDrawer";

const { Text, Paragraph } = Typography;

export const ReleaseOrdersPage: React.FC = () => {
  const { currentProjectId } = useProject();
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md !== "undefined" ? !screens.md : false;
  const actionRef = useRef<ActionType>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailDrawerState, setDetailDrawerState] = useState<{
    open: boolean;
    order: ReleaseOrderVO | null;
  }>({
    open: false,
    order: null,
  });

  const handleAudit = (record: ReleaseOrderVO, approved: boolean) => {
    let comment = "";
    modal.confirm({
      title: approved ? "审批通过生产发布单" : "驳回生产发布单",
      icon: approved ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">
            发布单号: {record.orderNo} ({record.title})
          </Text>
          <div style={{ marginTop: 12 }}>
            <Input.TextArea
              placeholder="请输入审批意见 (可选)..."
              rows={3}
              onChange={(e) => {
                comment = e.target.value;
              }}
            />
          </div>
        </div>
      ),
      okText: approved ? "确认批准" : "确认驳回",
      okType: approved ? "primary" : "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await auditReleaseOrder(
            {},
            { approved, comment },
            record.id!
          );
          message.success(approved ? "发布单已审批通过" : "发布单已驳回");
          actionRef.current?.reload();
        } catch (err: any) {
          message.error(err?.message || "审批操作失败");
        }
      },
    });
  };

  const handleExecute = (record: ReleaseOrderVO) => {
    modal.confirm({
      title: "立即执行发布单",
      icon: <PlayCircleOutlined style={{ color: "#1890ff" }} />,
      content: `确定立即对目标环境【${record.targetEnv?.toUpperCase()}】执行发布吗？包含的微服务将顺序触发部署。`,
      okText: "立即发布",
      cancelText: "取消",
      onOk: async () => {
        try {
          await executeReleaseOrder({}, record.id!);
          message.success("发布任务已触发执行");
          actionRef.current?.reload();
        } catch (err: any) {
          message.error(err?.message || "发布执行失败");
        }
      },
    });
  };

  const columns: ProColumns<ReleaseOrderVO>[] = [
    {
      title: "发布单号 / 标题",
      dataIndex: "orderNo",
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <AuditOutlined style={{ color: "#1890ff" }} />
            <Text strong style={{ fontSize: 13 }}>
              {record.title}
            </Text>
          </Space>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>
            <code>{record.orderNo}</code>
          </div>
        </Space>
      ),
    },
    {
      title: "目标环境",
      dataIndex: "targetEnv",
      width: 110,
      render: (_, record) => {
        const env = record.targetEnv?.toUpperCase();
        const color = env === "PROD" ? "red" : env === "STAGING" ? "purple" : env === "TEST" ? "orange" : "blue";
        return <Tag color={color}>{env}</Tag>;
      },
    },
    {
      title: "生命周期状态",
      dataIndex: "status",
      width: 140,
      valueEnum: {
        PENDING_APPROVAL: { text: "待审批", status: "Warning" },
        APPROVED: { text: "已审批", status: "Success" },
        EXECUTING: { text: "发布中", status: "Processing" },
        SUCCESS: { text: "已完成", status: "Success" },
        FAILED: { text: "失败", status: "Error" },
        REJECTED: { text: "已驳回", status: "Error" },
        DRAFT: { text: "草稿", status: "Default" },
      },
      render: (_, record) => <StatusBadge status={record.status || "DRAFT"} />,
    },
    {
      title: "ITSM 流程单号",
      dataIndex: "itsmProcessInstId",
      width: 130,
      render: (_, record) => {
        if (!record.itsmProcessInstId) return <Text type="secondary">-</Text>;
        return (
          <Space size={4}>
            <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
            <Tag color="green">ITSM#{record.itsmProcessInstId}</Tag>
          </Space>
        );
      },
    },
    {
      title: "申请人",
      dataIndex: "applicantName",
      width: 110,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 160,
      search: false,
    },
    {
      title: "操作",
      valueType: "option",
      width: 180,
      render: (_, record) => {
        const isPending = record.status === "PENDING_APPROVAL";
        const isApproved = record.status === "APPROVED";

        return (
          <Space size={6}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailDrawerState({ open: true, order: record })}
            >
              详情
            </Button>

            {isPending && (
              <>
                <Button
                  type="link"
                  size="small"
                  style={{ color: "#52c41a" }}
                  onClick={() => handleAudit(record, true)}
                >
                  批准
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => handleAudit(record, false)}
                >
                  驳回
                </Button>
              </>
            )}

            {isApproved && (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleExecute(record)}
              >
                发布
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
      <ProTable<ReleaseOrderVO>
        actionRef={actionRef}
        headerTitle="发布单与合规卡点中心"
        rowKey="id"
        size="small"
        search={{ labelWidth: "auto" }}
        scroll={{ x: 1000 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            新建发布单
          </Button>,
        ]}
        request={async (params) => {
          if (!currentProjectId) {
            return { data: [], success: true, total: 0 };
          }
          const res = await listReleaseOrders({
            projectId: currentProjectId,
            targetEnv: params.targetEnv,
            status: params.status,
            keyword: params.orderNo,
            page: params.current || 1,
            pageSize: params.pageSize || 20,
          });
          return {
            data: res.list || [],
            success: true,
            total: res.total || 0,
          };
        }}
        columns={columns}
      />

      {/* 新建发布单抽屉 */}
      <CreateReleaseDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      {/* 720px 发布单详情侧滑抽屉 */}
      <Drawer
        title={
          <Space>
            <AuditOutlined style={{ color: "#1890ff" }} />
            <span>发布单详情与审批轨迹</span>
          </Space>
        }
        placement="right"
        size={isMobile ? "100%" : 720}
        open={detailDrawerState.open}
        onClose={() => setDetailDrawerState({ open: false, order: null })}
        styles={{
          body: {
            padding: isMobile ? 16 : 24,
            paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 20px) + 24px)" : 24,
          },
        }}
      >
        {detailDrawerState.order && (
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={isMobile ? 1 : 2}>
              <Descriptions.Item label="发布单号" span={2}>
                <code>{detailDrawerState.order.orderNo}</code>
              </Descriptions.Item>
              <Descriptions.Item label="发布标题" span={2}>
                {detailDrawerState.order.title}
              </Descriptions.Item>
              <Descriptions.Item label="目标环境">
                <Tag color="blue">{detailDrawerState.order.targetEnv?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusBadge status={detailDrawerState.order.status || "DRAFT"} />
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {detailDrawerState.order.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">
                {detailDrawerState.order.approverName || <Text type="secondary">待分配/暂无</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {detailDrawerState.order.createTime}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {detailDrawerState.order.updateTime}
              </Descriptions.Item>
              {detailDrawerState.order.description && (
                <Descriptions.Item label="发布说明" span={2}>
                  {detailDrawerState.order.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {detailDrawerState.order.itsmProcessInstId && detailDrawerState.order.itsmProcessInstId > 0 ? (
              <Card size="small" title="🏛️ 关联 ITSM BPMN 2.0 审批卡点">
                <Space orientation="vertical" size={8}>
                  <Text>
                    流程实例工单: <b>#{detailDrawerState.order.itsmProcessInstId}</b>
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    依据生产变更合规规范，本单由 ITSM 流程引擎接管状态流转，审批通过后将自动回调通知解除卡点。
                  </Text>
                </Space>
              </Card>
            ) : null}

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                📦 变更微服务列表
              </Text>
              <div
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {(() => {
                  try {
                    const items = JSON.parse(detailDrawerState.order.servicesJson || "[]");
                    if (!items.length) {
                      return <div style={{ padding: "12px 16px", color: "#8c8c8c" }}>暂无变更服务</div>;
                    }
                    return items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 16px",
                          borderBottom: idx === items.length - 1 ? "none" : "1px solid #f0f0f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          <b>{item.appName}</b>
                        </span>
                        <Space>
                          <Tag color="cyan">版本: {item.version}</Tag>
                          <Tag color="default">Commit: {item.gitCommit}</Tag>
                        </Space>
                      </div>
                    ));
                  } catch {
                    return <div style={{ padding: "12px 16px", color: "#8c8c8c" }}>解析服务列表失败</div>;
                  }
                })()}
              </div>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default ReleaseOrdersPage;
