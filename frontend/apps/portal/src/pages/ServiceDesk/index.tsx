import React, { useState, useEffect } from 'react';
import {
  PageContainer,
  StatisticCard,
} from '@ant-design/pro-components';
import {
  Tabs,
  Badge,
  Space,
  Button,
  Tag,
  Typography,
  App as AntdApp,
} from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import {
  itsmListProcessDefs,
  itsmListTickets,
  type ItsmListProcessDefs200ListItem,
} from '@zero/api';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../contexts/LocaleContext';

import { ServiceCatalog } from './components/ServiceCatalog';
import { MyRequests } from './components/MyRequests';
import { PendingApprovals } from './components/PendingApprovals';
import { RequestModal } from './components/RequestModal';
import { RequestDetailDrawer } from './components/RequestDetailDrawer';

const { Text } = Typography;

export const ServiceDeskPage: React.FC = () => {
  const { onOpenLogin } = useOutletContext<{ onOpenLogin: () => void }>();
  const { isLoggedIn, profile } = useAuth();
  const { formatMessage } = useIntl();
  const { message } = AntdApp.useApp();

  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [processDefs, setProcessDefs] = useState<ItsmListProcessDefs200ListItem[]>([]);
  const [loadingDefs, setLoadingDefs] = useState(false);

  // 统计概览
  const [myRequestsCount, setMyRequestsCount] = useState<number>(0);
  const [myApprovalsCount, setMyApprovalsCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 模态框与抽屉控制
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ItsmListProcessDefs200ListItem | null>(null);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // 加载已发布服务目录
  const fetchProcessDefs = async () => {
    setLoadingDefs(true);
    try {
      const res = await itsmListProcessDefs({ page: 1, pageSize: 100 });
      setProcessDefs(res.list || []);
    } catch (err) {
      console.warn('获取服务目录失败:', err);
    } finally {
      setLoadingDefs(false);
    }
  };

  // 统计角标拉取
  const fetchCounts = async () => {
    if (!isLoggedIn) {
      setMyRequestsCount(0);
      setMyApprovalsCount(0);
      return;
    }
    try {
      const [reqRes, todoRes] = await Promise.all([
        itsmListTickets({ viewType: 'my_created', page: 1, pageSize: 1 }),
        itsmListTickets({ viewType: 'todo', page: 1, pageSize: 1 }),
      ]);
      setMyRequestsCount(reqRes.total || 0);
      setMyApprovalsCount(todoRes.total || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchProcessDefs();
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [isLoggedIn, refreshTrigger]);

  const handleOpenRequest = (service: ItsmListProcessDefs200ListItem) => {
    setSelectedService(service);
    setRequestModalOpen(true);
  };

  const handleOpenDetail = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setDetailDrawerOpen(true);
  };

  const handleRequestSuccess = () => {
    setRequestModalOpen(false);
    setSelectedService(null);
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('my_requests');
  };

  const tabItems = [
    {
      key: 'catalog',
      label: (
        <Space>
          <AppstoreOutlined />
          <span>服务大厅 / 目录中心</span>
          <Badge count={processDefs.length} style={{ backgroundColor: '#722ed1' }} />
        </Space>
      ),
      children: (
        <ServiceCatalog
          processDefs={processDefs}
          loading={loadingDefs}
          onRequest={handleOpenRequest}
          isLoggedIn={isLoggedIn}
          onOpenLogin={onOpenLogin}
        />
      ),
    },
    {
      key: 'my_requests',
      label: (
        <Space>
          <FileTextOutlined />
          <span>我发起的工单</span>
          {isLoggedIn && myRequestsCount > 0 && (
            <Badge count={myRequestsCount} style={{ backgroundColor: '#1677ff' }} />
          )}
        </Space>
      ),
      children: isLoggedIn ? (
        <MyRequests
          onViewDetail={handleOpenDetail}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary">查看您发起的申请工单需要先验证身份</Text>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              shape="round"
              onClick={onOpenLogin}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              登录企业员工账号
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'my_approvals',
      label: (
        <Space>
          <CheckCircleOutlined />
          <span>待我审批</span>
          {isLoggedIn && myApprovalsCount > 0 && (
            <Badge count={myApprovalsCount} style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      ),
      children: isLoggedIn ? (
        <PendingApprovals
          onViewDetail={handleOpenDetail}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary">审批决策中心需要先验证登录身份</Text>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              shape="round"
              onClick={onOpenLogin}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              登录账号查看待办
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: (
          <Space>
            <CustomerServiceOutlined style={{ color: '#722ed1' }} />
            <span>企业 IT 自助服务台</span>
          </Space>
        ),
        subTitle: '面向全体员工的一站式服务目录、自助提单申请与 SLA 全生命周期跟踪看板',
        extra: [
          <Button
            key="quick-apply"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (!isLoggedIn) {
                onOpenLogin();
                return;
              }
              if (processDefs.length > 0) {
                handleOpenRequest(processDefs[0]);
              } else {
                message.info('当前暂无可申请的已发布服务，请在管理后台发布');
              }
            }}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            一键快速提单
          </Button>,
        ],
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* 服务台运行态指标 Group */}
        <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
          <StatisticCard
            statistic={{
              title: '已就绪服务目录',
              value: processDefs.length,
              suffix: '项标准服务',
              description: <Text type="secondary">BPMN 2.0 流程引擎驱动</Text>,
              icon: <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 28 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: '我发起的工单',
              value: myRequestsCount,
              suffix: '笔申请',
              description: <Text type="secondary">实时流转与进度透视</Text>,
              icon: <FileTextOutlined style={{ color: '#1677ff', fontSize: 28 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: '待我审批',
              value: myApprovalsCount,
              suffix: '项待办',
              description: <Text type="secondary">主管决策与快速通过/驳回</Text>,
              icon: <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 28 }} />,
            }}
          />
          <StatisticCard.Divider />
          <StatisticCard
            statistic={{
              title: 'Temporal SLA 履约',
              value: '99.8%',
              description: <Text type="secondary">毫秒级分布式超时监控</Text>,
              icon: <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: 28 }} />,
            }}
          />
        </StatisticCard.Group>

        {/* 核心 Tab 页签 */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          size="large"
          type="line"
          items={tabItems}
        />
      </div>

      {/* 提单弹窗 */}
      <RequestModal
        open={requestModalOpen}
        service={selectedService}
        onCancel={() => {
          setRequestModalOpen(false);
          setSelectedService(null);
        }}
        onSuccess={handleRequestSuccess}
      />

      {/* 工单详情抽屉 */}
      <RequestDetailDrawer
        open={detailDrawerOpen}
        ticketId={selectedTicketId}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedTicketId(null);
        }}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        currentUserId={profile?.userId}
      />
    </PageContainer>
  );
};

export default ServiceDeskPage;
