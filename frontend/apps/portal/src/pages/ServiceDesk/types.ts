import type { ReactNode } from 'react';

export type ServiceCategory = 'ALL' | 'ACCESS' | 'HARDWARE' | 'NETWORK' | 'SOFTWARE' | 'DEV_OPS';

export interface ServiceItem {
  id: number;
  procCode: string;
  procName: string;
  description: string;
  category: ServiceCategory;
  slaName?: string;
  slaHours?: number;
  iconName: string;
  formDataSchema?: string;
  status: number;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  ALL: '全部服务',
  ACCESS: '账号与权限',
  HARDWARE: '办公与设备',
  NETWORK: '网络与通信',
  SOFTWARE: '业务与办公系统',
  DEV_OPS: '研发与运维变更',
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; desc: string; hours: number }
> = {
  P1: { label: 'P1 极高紧急', color: 'red', desc: '业务完全瘫痪 / 1小时内响应', hours: 1 },
  P2: { label: 'P2 高优先级', color: 'orange', desc: '核心功能受阻 / 2小时内响应', hours: 2 },
  P3: { label: 'P3 中优先级', color: 'blue', desc: '普通业务影响 / 4小时内响应', hours: 4 },
  P4: { label: 'P4 低优先级', color: 'default', desc: '常规咨询或辅助需求 / 8小时内响应', hours: 8 },
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; badgeStatus: 'default' | 'processing' | 'success' | 'error' | 'warning' }
> = {
  PENDING: { label: '待派发', color: 'gold', badgeStatus: 'warning' },
  RUNNING: { label: '处理中', color: 'processing', badgeStatus: 'processing' },
  APPROVED: { label: '已通过', color: 'success', badgeStatus: 'success' },
  REJECTED: { label: '已驳回', color: 'error', badgeStatus: 'error' },
  REVOKED: { label: '已撤销', color: 'default', badgeStatus: 'default' },
  CLOSED: { label: '已关闭', color: 'default', badgeStatus: 'default' },
};
