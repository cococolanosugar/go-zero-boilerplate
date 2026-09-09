import type React from "react";

/**
 * 前端专属视图模型与交互状态类型定义 (UI ViewModels & Client-Only Types)
 *
 * 架构分工守则：
 * 1. 服务端 DTO / 接口契约：统一由 @zero/api (通过 goctl api ts 自动生成) 导出，严禁在此手工重复声明！
 * 2. 此目录仅用于定义纯前端视图模型、页面多步骤交互状态、表格个性化列偏好、前端临时缓存结构等。
 */

/**
 * 仪表盘时间范围筛选器类型
 */
export type DashboardDateRange = "today" | "week" | "month" | "year";

/**
 * 仪表盘快速指标卡片纯前端视图数据
 */
export interface MetricCardViewModel {
  key: string;
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: "up" | "down" | "flat";
  rate?: string;
  tooltip?: string;
}

/**
 * 多标签页页面历史项视图模型
 */
export interface TabItemViewModel {
  key: string;
  title: string;
  pathname: string;
  search?: string;
  closable: boolean;
  icon?: React.ReactNode;
}

/**
 * 用户自定义表格列显示与排序偏好
 */
export interface TableColumnCustomSetting {
  dataIndex: string;
  visible: boolean;
  fixed?: "left" | "right";
  order: number;
}
