import React, { useMemo } from 'react';
import {
  BetaSchemaForm,
  type ProFormColumnsType,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { Card, Empty } from 'antd';

export type FieldPermission = 'writable' | 'readonly' | 'required' | 'hidden';

export interface DynamicTicketFormProps {
  schema?: string | ProFormColumnsType<Record<string, any>>[];
  initialValues?: Record<string, any>;
  fieldPermissions?: Record<string, FieldPermission>;
  readonly?: boolean;
  onFinish?: (values: Record<string, any>) => Promise<boolean | void>;
  formRef?: React.MutableRefObject<ProFormInstance | undefined>;
  submitter?: any;
  layout?: 'horizontal' | 'vertical';
  grid?: boolean;
  cardProps?: any;
}

const defaultColumns: ProFormColumnsType<Record<string, any>>[] = [
  {
    title: '工单标题',
    dataIndex: 'title',
    formItemProps: {
      rules: [{ required: true, message: '请输入工单标题' }],
    },
    colProps: { md: 16, xs: 24 },
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    valueType: 'select',
    valueEnum: {
      P1: { text: 'P1 极高紧急 (1小时响应)', status: 'Error' },
      P2: { text: 'P2 高优先级 (2小时响应)', status: 'Warning' },
      P3: { text: 'P3 中优先级 (4小时响应)', status: 'Processing' },
      P4: { text: 'P4 低优先级 (8小时响应)', status: 'Default' },
    },
    formItemProps: {
      rules: [{ required: true, message: '请选择优先级' }],
    },
    colProps: { md: 8, xs: 24 },
  },
  {
    title: '服务类别',
    dataIndex: 'category',
    valueType: 'select',
    valueEnum: {
      HARDWARE: { text: '硬件故障报修' },
      SOFTWARE: { text: '业务系统异常' },
      NETWORK: { text: '网络接入/VPN' },
      ACCESS: { text: '账号与权限申请' },
      DEV_OPS: { text: '发布与运维变更' },
    },
    colProps: { md: 12, xs: 24 },
  },
  {
    title: '工单来源',
    dataIndex: 'source',
    valueType: 'select',
    valueEnum: {
      PORTAL: { text: '自助服务门户' },
      CONSOLE: { text: '管理控制台' },
      MONITOR: { text: 'Prometheus监控预警' },
      HOTLINE: { text: '电话热线派单' },
    },
    colProps: { md: 12, xs: 24 },
  },
  {
    title: '需求与问题描述',
    dataIndex: 'description',
    valueType: 'textarea',
    fieldProps: {
      rows: 4,
      placeholder: '请详细描述故障现象、复现步骤、影响范围及业务期望',
    },
    colProps: { span: 24 },
  },
  {
    title: '处置方案与执行记录',
    dataIndex: 'solution',
    valueType: 'textarea',
    fieldProps: {
      rows: 3,
      placeholder: '处理人在此填写根因排查、临时规避或最终修复方案',
    },
    colProps: { span: 24 },
  },
  {
    title: '处理批注 / 审批意见',
    dataIndex: 'auditOpinion',
    valueType: 'textarea',
    fieldProps: {
      rows: 2,
      placeholder: '审批人签署意见',
    },
    colProps: { span: 24 },
  },
];

export const DynamicTicketForm: React.FC<DynamicTicketFormProps> = ({
  schema,
  initialValues = {},
  fieldPermissions = {},
  readonly = false,
  onFinish,
  formRef,
  submitter = false,
  layout = 'vertical',
  grid = true,
  cardProps,
}) => {
  // 解析 Schema Columns
  const baseColumns = useMemo<ProFormColumnsType<Record<string, any>>[]>(() => {
    if (!schema) return defaultColumns;
    if (typeof schema === 'string') {
      try {
        const parsed = JSON.parse(schema);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.columns && Array.isArray(parsed.columns)) return parsed.columns;
      } catch (_) {
        return defaultColumns;
      }
    }
    if (Array.isArray(schema)) return schema;
    return defaultColumns;
  }, [schema]);

  // 根据节点字段权限矩阵动态转换列定义
  const transformedColumns = useMemo(() => {
    const cols: ProFormColumnsType<Record<string, any>>[] = [];

    baseColumns.forEach((col) => {
      const dataIndex = String(col.dataIndex || '');
      const perm = fieldPermissions[dataIndex] || (readonly ? 'readonly' : 'writable');

      // 1. 隐藏字段直接过滤
      if (perm === 'hidden') {
        return;
      }

      const colClone: ProFormColumnsType<Record<string, any>> = {
        ...col,
        colProps: col.colProps || { span: 24 },
      };

      // 2. 只读控制
      if (readonly || perm === 'readonly') {
        colClone.readonly = true;
      } else {
        colClone.readonly = false;
      }

      // 3. 必填控制
      if (perm === 'required' && !readonly) {
        colClone.formItemProps = {
          ...colClone.formItemProps,
          rules: [{ required: true, message: `请填写${colClone.title || '此项'}` }],
        };
      }

      cols.push(colClone);
    });

    return cols;
  }, [baseColumns, fieldPermissions, readonly]);

  if (transformedColumns.length === 0) {
    return (
      <Card variant="borderless" {...cardProps}>
        <Empty description="该审批节点未配置任何可见表单字段" />
      </Card>
    );
  }

  return (
    <BetaSchemaForm<Record<string, any>>
      layoutType="Form"
      formRef={formRef}
      columns={transformedColumns}
      initialValues={initialValues}
      onFinish={onFinish}
      submitter={submitter}
      layout={layout}
      grid={grid}
      rowProps={{
        gutter: [16, 8],
      }}
    />
  );
};
