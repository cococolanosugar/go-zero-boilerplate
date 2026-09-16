import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Badge,
  Space,
  Button,
  Radio,
  Input,
  Typography,
  Card,
  Popconfirm,
  App as AntdApp,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  RollbackOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  itsmListTickets,
  itsmCancelTicket,
  type ItsmListTickets200ListItem,
} from '@zero/api';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types';

const { Text } = Typography;

interface MyRequestsProps {
  onViewDetail: (ticketId: number) => void;
  refreshTrigger: number;
}

export const MyRequests: React.FC<MyRequestsProps> = ({
  onViewDetail,
  refreshTrigger,
}) => {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<ItsmListTickets200ListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [keyword, setKeyword] = useState<string>('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await itsmListTickets({
        viewType: 'my_created',
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        keyword: keyword.trim() || undefined,
        page,
        pageSize: 10,
      });
      setTickets(res.list || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(`获取工单列表失败: ${err.message || '网络异常'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, refreshTrigger]);

  const handleSearch = () => {
    setPage(1);
    fetchTickets();
  };

  const handleRevoke = async (ticketId: number) => {
    try {
      await itsmCancelTicket(ticketId, { reason: '发起人主动撤回申请' });
      message.success('工单已成功撤回');
      fetchTickets();
    } catch (err: any) {
      message.error(`撤回失败: ${err.message || '未知错误'}`);
    }
  };

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <Text strong style={{ color: '#722ed1' }}>#{id}</Text>,
    },
    {
      title: '服务流程',
      dataIndex: 'procName',
      key: 'procName',
      width: 160,
      render: (text: string) => <Tag color="purple">{text || '通用服务'}</Tag>,
    },
    {
      title: '申请主题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: ItsmListTickets200ListItem) => (
        <a
          onClick={() => onViewDetail(record.id)}
          style={{ color: '#1677ff', fontWeight: 500 }}
        >
          {title}
        </a>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string) => {
        const cfg = PRIORITY_CONFIG[priority];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{priority}</Tag>;
      },
    },
    {
      title: '流转状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status];
        return cfg ? (
          <Badge status={cfg.badgeStatus} text={cfg.label} />
        ) : (
          <Tag>{status}</Tag>
        );
      },
    },
    {
      title: 'SLA履约',
      dataIndex: 'slaStatus',
      key: 'slaStatus',
      width: 110,
      render: (slaStatus: string) => {
        if (slaStatus === 'TIMEOUT' || slaStatus === 'BREACHED') {
          return <Tag color="red">已超时</Tag>;
        }
        if (slaStatus === 'WARNING') {
          return <Tag color="orange">预警中</Tag>;
        }
        return <Tag color="green">正常履约</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (time: string) => <Text type="secondary">{time || '-'}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ItsmListTickets200ListItem) => {
        const canRevoke = record.status === 'RUNNING' || record.status === 'PENDING';
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record.id)}
            >
              查看
            </Button>
            {canRevoke && (
              <Popconfirm
                title="确定撤回该申请吗？"
                description="撤回后流程将立即终止不可逆。"
                onConfirm={() => handleRevoke(record.id)}
                okText="撤回"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" danger size="small" icon={<RollbackOutlined />}>
                  撤回
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card variant="borderless" style={{ borderRadius: 12 }}>
      {/* 头部筛选操作栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space wrap>
          <Text type="secondary">状态筛选：</Text>
          <Radio.Group
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            buttonStyle="solid"
          >
            <Radio.Button value="ALL">全部</Radio.Button>
            <Radio.Button value="RUNNING">处理中</Radio.Button>
            <Radio.Button value="APPROVED">已通过</Radio.Button>
            <Radio.Button value="REJECTED">已驳回</Radio.Button>
            <Radio.Button value="REVOKED">已撤销</Radio.Button>
          </Radio.Group>
        </Space>

        <Space>
          <Input
            placeholder="搜索工单标题或编号..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            查询
          </Button>
          <Button icon={<SyncOutlined />} onClick={fetchTickets}>
            刷新
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={tickets}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          showTotal: (t) => `共 ${t} 条申请记录`,
          onChange: (p) => setPage(p),
        }}
      />
    </Card>
  );
};

export default MyRequests;
