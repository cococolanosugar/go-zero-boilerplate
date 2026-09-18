import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App as AntdApp, ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { routes } from '../src/config/routes';
import { TitanPortalPage } from '../src/pages/Titan';

describe('Portal Titan Integration Tests', () => {
  it('should have /titan route configured in portal routes.ts', () => {
    const mainRoutes = routes.find((r) => r.path === '/' && r.layout === true)?.routes || [];
    const titanRoute = mainRoutes.find((r) => r.path === '/titan');

    expect(titanRoute).toBeDefined();
    expect(titanRoute?.name).toBe('menu.titan');
    expect(titanRoute?.locale).toBe('menu.titan');
    expect(titanRoute?.icon).toBe('DeploymentUnitOutlined');
  });

  it('should render TitanPortalPage with hero header and action buttons', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <AntdApp>
            <TitanPortalPage />
          </AntdApp>
        </ConfigProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Titan 研发交付平台')).toBeDefined();
    expect(screen.getByText('企业级云原生持续交付平台')).toBeDefined();
    expect(screen.getByText('打开 Titan 独立工作台 (:3002)')).toBeDefined();
  });
});
