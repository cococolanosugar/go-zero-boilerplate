import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App as AntdApp, ConfigProvider } from 'antd';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  CATEGORY_LABELS,
} from '../src/pages/ServiceDesk/types';
import { ServiceCatalog } from '../src/pages/ServiceDesk/components/ServiceCatalog';
import { RequestModal } from '../src/pages/ServiceDesk/components/RequestModal';

describe('Portal ITSM Service Desk Tests', () => {
  it('should verify priority configuration labels and hours', () => {
    expect(PRIORITY_CONFIG.P1.hours).toBe(1);
    expect(PRIORITY_CONFIG.P1.color).toBe('red');
    expect(PRIORITY_CONFIG.P2.hours).toBe(2);
    expect(PRIORITY_CONFIG.P3.hours).toBe(4);
    expect(PRIORITY_CONFIG.P4.hours).toBe(8);
  });

  it('should verify status badge mappings cover all ticket states', () => {
    expect(STATUS_CONFIG.PENDING.badgeStatus).toBe('warning');
    expect(STATUS_CONFIG.RUNNING.badgeStatus).toBe('processing');
    expect(STATUS_CONFIG.APPROVED.badgeStatus).toBe('success');
    expect(STATUS_CONFIG.REJECTED.badgeStatus).toBe('error');
    expect(STATUS_CONFIG.REVOKED.badgeStatus).toBe('default');
    expect(STATUS_CONFIG.CLOSED.badgeStatus).toBe('default');
  });

  it('should verify category labels dictionary', () => {
    expect(CATEGORY_LABELS.ALL).toBe('全部服务');
    expect(CATEGORY_LABELS.ACCESS).toBe('账号与权限');
    expect(CATEGORY_LABELS.HARDWARE).toBe('办公与设备');
    expect(CATEGORY_LABELS.NETWORK).toBe('网络与通信');
    expect(CATEGORY_LABELS.DEV_OPS).toBe('研发与运维变更');
  });

  it('should render ServiceCatalog with services and category buttons', () => {
    const mockServices = [
      {
        id: 1,
        procCode: 'VPN_ACCESS',
        procName: 'VPN 远程接入申请',
        description: '申请访问公司内网与生产堡垒机网段',
        status: 2,
      },
      {
        id: 2,
        procCode: 'HARDWARE_SCREEN',
        procName: '4K显示器领用',
        description: '申请研发专属高刷显示器外设',
        status: 2,
      },
    ];

    render(
      <ConfigProvider>
        <AntdApp>
          <ServiceCatalog
            processDefs={mockServices}
            loading={false}
            onRequest={vi.fn()}
            isLoggedIn={true}
            onOpenLogin={vi.fn()}
          />
        </AntdApp>
      </ConfigProvider>
    );

    expect(screen.getByText('企业统一 IT 服务目录与自助申请大厅')).toBeDefined();
    expect(screen.getByText('VPN 远程接入申请')).toBeDefined();
    expect(screen.getByText('4K显示器领用')).toBeDefined();
  });

  it('should render RequestModal with service information', () => {
    const mockService = {
      id: 10,
      procCode: 'CLOUD_HOST_APPLY',
      procName: '云主机资源申请',
      description: '申请测试环境云主机资源',
      status: 2,
    };

    render(
      <ConfigProvider>
        <AntdApp>
          <RequestModal
            open={true}
            service={mockService}
            onCancel={vi.fn()}
            onSuccess={vi.fn()}
          />
        </AntdApp>
      </ConfigProvider>
    );

    expect(screen.getByText(/发起服务申请 - 云主机资源申请/)).toBeDefined();
    expect(screen.getByText('流程编码: CLOUD_HOST_APPLY')).toBeDefined();
    expect(screen.getByText('确认并提交申请')).toBeDefined();
  });
});
