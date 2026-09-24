// 与后端 app/titan/model/status.go 口径对齐的状态枚举（单一真源），
// 前端禁止散落书写状态魔法字符串，统一从此处引用。
// 注意：本文件为 titan 应用 src/constants/status.ts 的同步副本（admin 无法跨应用引用其源码）。
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
// text 用于详情/大盘完整展示，label 用于列表精简展示；
// WAITING_APPROVAL 为人工审批门禁的 UI 过渡态（非 DB 落库枚举）。
export interface ExecStatusMeta {
  color: string;
  text: string;
  label: string;
}

export const execStatusMap: Record<string, ExecStatusMeta> = {
  PENDING: { color: 'default', text: '排队就绪', label: '就绪' },
  RUNNING: { color: 'processing', text: '执行中', label: '执行中' },
  WAITING_APPROVAL: { color: 'warning', text: '等待人工审批', label: '等待审批' },
  SUCCESS: { color: 'success', text: '发布成功', label: '发布成功' },
  FAILED: { color: 'error', text: '执行失败', label: '失败' },
  CANCELLED: { color: 'default', text: '已终止', label: '已终止' },
  ABORTED: { color: 'warning', text: '已中止', label: '已中止' },
  SKIPPED: { color: 'default', text: '已跳过', label: '已跳过' },
};
