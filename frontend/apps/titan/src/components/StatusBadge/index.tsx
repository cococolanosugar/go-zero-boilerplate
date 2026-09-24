import React from "react";
import { Badge, Space } from "antd";

export type StatusType =
  | "RUNNING"
  | "DEPLOYING"
  | "SUCCESS"
  | "HEALTHY"
  | "FAILED"
  | "UNHEALTHY"
  | "PENDING"
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "STOPPED"
  | "IN_SYNC"
  | "AHEAD"
  | "BEHIND"
  | "NOT_DEPLOYED";

interface StatusBadgeProps {
  status: string | StatusType;
  text?: React.ReactNode;
  showText?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  showText = true,
}) => {
  const upper = String(status || "").toUpperCase();

  let badgeStatus: "success" | "processing" | "error" | "warning" | "default" = "default";
  let label = text || status;

  switch (upper) {
    case "RUNNING":
    case "DEPLOYING":
    case "EXECUTING":
      badgeStatus = "processing";
      label = text || (upper === "RUNNING" ? "运行中" : upper === "DEPLOYING" ? "部署中" : "执行中");
      break;
    case "SUCCESS":
    case "HEALTHY":
    case "ACTIVE":
    case "IN_SYNC":
    case "APPROVED":
      badgeStatus = "success";
      label = text || (upper === "HEALTHY" ? "健康" : upper === "IN_SYNC" ? "一致" : upper === "APPROVED" ? "已批准" : "成功");
      break;
    case "FAILED":
    case "UNHEALTHY":
    case "REJECTED":
      badgeStatus = "error";
      label = text || (upper === "UNHEALTHY" ? "异常" : upper === "REJECTED" ? "已驳回" : "失败");
      break;
    case "BEHIND":
    case "PENDING_APPROVAL":
    case "DEGRADED":
      badgeStatus = "warning";
      label = text || (upper === "BEHIND" ? "落后待晋级" : upper === "PENDING_APPROVAL" ? "待审批" : "降级");
      break;
    case "PENDING":
    case "DRAFT":
    case "STOPPED":
    case "NOT_DEPLOYED":
    default:
      badgeStatus = "default";
      label = text || (upper === "DRAFT" ? "草稿" : upper === "NOT_DEPLOYED" ? "未部署" : upper === "STOPPED" ? "已停止" : "待处理");
      break;
  }

  return (
    <Space orientation="horizontal" size={6} style={{ display: "inline-flex", alignItems: "center" }}>
      <Badge status={badgeStatus} />
      {showText && <span style={{ fontSize: 13, lineHeight: "20px" }}>{label}</span>}
    </Space>
  );
};

export default StatusBadge;
