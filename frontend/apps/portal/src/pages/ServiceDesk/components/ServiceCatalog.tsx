import React, { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Input,
  Radio,
  Empty,
  Tooltip,
  Badge,
  Flex,
} from 'antd';
import {
  SearchOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  LaptopOutlined,
  ApiOutlined,
  CloudServerOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { ItsmListProcessDefs200ListItem } from '@zero/api';
import { CATEGORY_LABELS, type ServiceCategory } from '../types';

const { Title, Paragraph, Text } = Typography;

interface ServiceCatalogProps {
  processDefs: ItsmListProcessDefs200ListItem[];
  loading: boolean;
  onRequest: (service: ItsmListProcessDefs200ListItem) => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

// 智能推导服务所属类别与展示图标
function getCategoryInfo(proc: ItsmListProcessDefs200ListItem): {
  category: ServiceCategory;
  icon: React.ReactNode;
  slaText: string;
} {
  const code = (proc.procCode || '').toUpperCase();
  const name = (proc.procName || '').toLowerCase();

  if (code.includes('ACCESS') || name.includes('权限') || name.includes('账号') || name.includes('vpn')) {
    return {
      category: 'ACCESS',
      icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      slaText: '承诺 2 小时响应',
    };
  }
  if (code.includes('HARDWARE') || name.includes('硬件') || name.includes('设备') || name.includes('外设')) {
    return {
      category: 'HARDWARE',
      icon: <LaptopOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      slaText: '承诺 4 小时交付',
    };
  }
  if (code.includes('DEV') || code.includes('OPS') || name.includes('运维') || name.includes('发布') || name.includes('变更')) {
    return {
      category: 'DEV_OPS',
      icon: <CloudServerOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      slaText: '承诺 1 小时响应',
    };
  }
  return {
    category: 'SOFTWARE',
    icon: <ApiOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    slaText: '承诺 2 小时响应',
  };
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  processDefs,
  loading,
  onRequest,
  isLoggedIn,
  onOpenLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 过滤当前可用且处于已发布状态（Status=2 或未指定）的流程
  const availableServices = useMemo(() => {
    return processDefs.filter((p) => p.status === 2 || p.status === undefined);
  }, [processDefs]);

  const filteredServices = useMemo(() => {
    return availableServices.filter((service) => {
      const { category } = getCategoryInfo(service);
      const matchCategory = selectedCategory === 'ALL' || category === selectedCategory;
      const matchKeyword =
        !searchKeyword.trim() ||
        service.procName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        service.procCode?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [availableServices, selectedCategory, searchKeyword]);

  const handleApply = (service: ItsmListProcessDefs200ListItem) => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    onRequest(service);
  };

  return (
    <div>
      {/* 搜索与分类导航 Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)',
          padding: '28px 24px',
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 2px 10px rgba(114, 46, 209, 0.04)',
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <Title level={4} style={{ margin: 0, color: '#391085' }}>
              企业统一 IT 服务目录与自助申请大厅
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
              涵盖账号权限、办公外设、网络配置与系统变更，在线提交申请，SLA 自动承诺全链路追踪。
            </Paragraph>
          </Col>
          <Col xs={24} md={10}>
            <Input
              size="large"
              placeholder="搜索服务名称、服务编码或关键词..."
              prefix={<SearchOutlined style={{ color: '#722ed1' }} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <div style={{ marginTop: 20 }}>
          <Space wrap size="middle">
            <Text type="secondary" style={{ fontSize: 13 }}>服务分类：</Text>
            <Radio.Group
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              buttonStyle="solid"
            >
              {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((catKey) => (
                <Radio.Button key={catKey} value={catKey}>
                  {CATEGORY_LABELS[catKey]}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Space>
        </div>
      </div>

      {/* 服务卡片网格 */}
      {filteredServices.length === 0 ? (
        <Card variant="borderless" style={{ textAlign: 'center', padding: '40px 0' }}>
          <Empty
            description={
              <span>
                未找到匹配的 IT 服务项，您可以更换关键词或在管理后台
                <Tag color="purple" style={{ marginLeft: 6 }}>/itsm/process-defs</Tag> 发布新服务流程。
              </span>
            }
          />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {filteredServices.map((service) => {
            const { category, icon, slaText } = getCategoryInfo(service);
            return (
              <Col xs={24} sm={12} lg={8} key={service.id}>
                <Card
                  hoverable
                  variant="borderless"
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #f0f0f0',
                  }}
                  styles={{
                    body: {
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      padding: 20,
                    },
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: '#f9f0ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {icon}
                      </div>
                      <Tag color="purple">{CATEGORY_LABELS[category]}</Tag>
                    </div>

                    <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 16 }}>
                      {service.procName}
                    </Title>

                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ fontSize: 13, minHeight: 38, marginBottom: 12 }}
                    >
                      {service.description || '标准企业 IT 服务流转，包含主管初审与专业运维团队节点承接。'}
                    </Paragraph>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #f5f5f5',
                      paddingTop: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Space size={4}>
                      <ClockCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {slaText}
                      </Text>
                    </Space>

                    <Button
                      type="primary"
                      size="small"
                      shape="round"
                      icon={<RightOutlined />}
                      onClick={() => handleApply(service)}
                      style={{ background: '#722ed1', borderColor: '#722ed1' }}
                    >
                      立即申请
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default ServiceCatalog;
