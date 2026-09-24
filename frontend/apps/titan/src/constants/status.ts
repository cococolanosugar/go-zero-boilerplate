// 与后端 app/titan/model/status.go 口径对齐的状态枚举（单一真源），
// 前端禁止散落书写状态魔法字符串，统一从此处引用。
export const EXEC_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  ABORTED: 'ABORTED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
} as const;

// 环境-应用绑定状态（含部署幂等锁 DEPLOYING）
export const BINDING_STATUS = {
  PENDING: 'PENDING',
  DEPLOYING: 'DEPLOYING',
  RUNNING: 'RUNNING',
  FAILED: 'FAILED',
  STOPPED: 'STOPPED',
} as const;

export const ARTIFACT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  EXPIRED: 'EXPIRED',
} as const;

export const CLUSTER_STATUS = {
  HEALTHY: 'HEALTHY',
  UNHEALTHY: 'UNHEALTHY',
  UNKNOWN: 'UNKNOWN',
} as const;

export const ENV_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

// 通用 Tag 快捷配色（与 AntD 预设色对齐）
export const statusTagColor: Record<string, string> = {
  SUCCESS: 'success',
  RUNNING: 'processing',
  FAILED: 'error',
  ABORTED: 'default',
  PENDING: 'default',
};

// 流水线执行状态 → 展示元数据。
// textKey/labelKey 为三语资源 key，页面通过 useLocale().formatMessage 渲染；
// WAITING_APPROVAL 为人工审批门禁的 UI 过渡态（非 DB 落库枚举）。
export interface ExecStatusMeta {
  color: string;
  textKey: string;
  labelKey: string;
}

export const execStatusMap: Record<string, ExecStatusMeta> = {
  PENDING: { color: 'default', textKey: 'titan.status.pending', labelKey: 'titan.status.pendingShort' },
  RUNNING: { color: 'processing', textKey: 'titan.status.running', labelKey: 'titan.status.running' },
  WAITING_APPROVAL: { color: 'warning', textKey: 'titan.status.waitingApproval', labelKey: 'titan.status.waitingApprovalShort' },
  SUCCESS: { color: 'success', textKey: 'titan.status.success', labelKey: 'titan.status.success' },
  FAILED: { color: 'error', textKey: 'titan.status.failed', labelKey: 'titan.status.failedShort' },
  CANCELLED: { color: 'default', textKey: 'titan.status.cancelled', labelKey: 'titan.status.cancelled' },
  ABORTED: { color: 'warning', textKey: 'titan.status.aborted', labelKey: 'titan.status.aborted' },
  SKIPPED: { color: 'default', textKey: 'titan.status.skipped', labelKey: 'titan.status.skipped' },
};
