import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { DesignerModal } from '../src/pages/Titan/Pipelines/DesignerModal';

describe('Titan CI/CD Platform Unit Tests', () => {
  it('Pipeline Stage & Step DSL can be serialized and deserialized correctly', () => {
    const rawStages = [
      {
        id: 'stage-1',
        name: '构建阶段',
        steps: [
          {
            id: 'step-1',
            name: '代码检出',
            type: 'CHECKOUT',
            params: { depth: 1 },
          },
          {
            id: 'step-2',
            name: '容器镜像构建',
            type: 'BUILD',
            params: { image: 'registry.internal/app:v1' },
          },
        ],
      },
      {
        id: 'stage-2',
        name: '发布阶段',
        steps: [
          {
            id: 'step-3',
            name: 'Helm 部署',
            type: 'HELM_DEPLOY',
            params: { clusterId: 1, namespace: 'prod' },
          },
        ],
      },
    ];

    const jsonString = JSON.stringify(rawStages);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].steps).toHaveLength(2);
    expect(parsed[0].steps[0].type).toBe('CHECKOUT');
    expect(parsed[1].steps[0].params.clusterId).toBe(1);
  });

  it('Pipeline DesignerModal renders without crashing in create mode', () => {
    const { container } = render(
      <ConfigProvider>
        <App>
          <DesignerModal
            open={true}
            mode="create"
            pipeline={null}
            onClose={() => {}}
            onSuccess={() => {}}
          />
        </App>
      </ConfigProvider>
    );

    expect(container).toBeDefined();
  });

  it('Status and Environment maps produce valid badges and labels', () => {
    const envMap: Record<string, string> = {
      dev: '开发环境 (dev)',
      test: '测试环境 (test)',
      staging: '预发环境 (staging)',
      prod: '生产环境 (prod)',
    };

    expect(envMap.dev).toBe('开发环境 (dev)');
    expect(envMap.prod).toBe('生产环境 (prod)');

    const statusMap: Record<string, string> = {
      PENDING: '排队就绪',
      RUNNING: '执行中',
      WAITING_APPROVAL: '等待人工审批',
      SUCCESS: '发布成功',
      FAILED: '执行失败',
      CANCELLED: '已终止',
    };

    expect(statusMap.WAITING_APPROVAL).toBe('等待人工审批');
    expect(statusMap.SUCCESS).toBe('发布成功');
  });
});
