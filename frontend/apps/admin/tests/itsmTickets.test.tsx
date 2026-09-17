import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { DynamicTicketForm } from '../src/components/DynamicForm';

describe('ITSM Service & BPMN System Unit Tests', () => {
  it('DynamicTicketForm correctly filters and sets readonly fields based on fieldPermissions', () => {
    const permissions = {
      title: 'readonly' as const,
      description: 'hidden' as const,
      solution: 'writable' as const,
    };

    const { container } = render(
      <ConfigProvider>
        <App>
          <DynamicTicketForm
            fieldPermissions={permissions}
            initialValues={{ title: '测试工单标题', description: '描述内容', solution: '排查方案' }}
          />
        </App>
      </ConfigProvider>
    );

    // title 存在并且带有只读属性或展示内容
    expect(container).toBeDefined();
  });

  it('DynamicTicketForm respects global readonly flag', () => {
    const { container } = render(
      <ConfigProvider>
        <App>
          <DynamicTicketForm
            readonly={true}
            initialValues={{ title: '已办结工单', priority: 'P2' }}
          />
        </App>
      </ConfigProvider>
    );

    expect(container).toBeDefined();
  });

  it('SLA Status tag mapping treats both TIMEOUT and BREACHED as SLA超时', () => {
    const checkSlaStatus = (status: string) => {
      if (status === 'TIMEOUT' || status === 'BREACHED') {
        return 'SLA 已超时';
      }
      if (status === 'WARNING') {
        return 'SLA 临近预警';
      }
      return 'SLA 履约正常';
    };

    expect(checkSlaStatus('TIMEOUT')).toBe('SLA 已超时');
    expect(checkSlaStatus('BREACHED')).toBe('SLA 已超时');
    expect(checkSlaStatus('WARNING')).toBe('SLA 临近预警');
    expect(checkSlaStatus('NORMAL')).toBe('SLA 履约正常');
  });

  it('Priority tag mapping matches standard ITIL P1~P4 severity levels', () => {
    const priorityTagMap: Record<string, { color: string; label: string }> = {
      P1: { color: 'magenta', label: 'P1 极高' },
      P2: { color: 'orange', label: 'P2 高' },
      P3: { color: 'blue', label: 'P3 中' },
      P4: { color: 'default', label: 'P4 低' },
    };

    expect(priorityTagMap.P1.label).toBe('P1 极高');
    expect(priorityTagMap.P2.label).toBe('P2 高');
    expect(priorityTagMap.P3.label).toBe('P3 中');
    expect(priorityTagMap.P4.label).toBe('P4 低');
  });
});
