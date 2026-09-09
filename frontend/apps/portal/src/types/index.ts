import type React from "react";

/**
 * 官方门户端专属视图模型与交互状态类型定义 (Portal UI ViewModels)
 *
 * 架构分工守则：
 * 1. 服务端 DTO / 接口契约：统一由 @zero/api (通过 goctl api ts 自动生成) 导出，严禁在此手工重复声明！
 * 2. 此目录仅用于定义门户前台特色组件数据模型、工作台请求卡片、展示型指标等。
 */

/**
 * 微服务技术治理架构支柱卡片视图模型
 */
export interface ArchitecturePillarViewModel {
  key: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  tagText: string;
  tagColor: string;
}

/**
 * 联调工作台预置测试接口定义
 */
export interface WorkbenchEndpointViewModel {
  key: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  requireAuth: boolean;
  defaultPayload?: Record<string, any>;
}

/**
 * 门户全栈拓扑节点视图模型
 */
export interface TopologyNodeViewModel {
  id: string;
  label: string;
  layer: "gateway" | "rpc" | "storage" | "infra";
  port: number;
  status: "active" | "standby" | "maintenance";
}
