export type ServiceType = "gateway" | "rpc" | "infra";
export type ServiceProtocol = "HTTP/REST" | "gRPC/Protobuf" | "TCP/SQL" | "RESP/Redis" | "Temporal/gRPC";

export interface ServiceItemVO {
  id: string;
  name: string;
  code: string;
  type: ServiceType;
  port: number;
  protocol: ServiceProtocol;
  owner: string;
  language: string;
  domain: string;
  description: string;
  protoPath?: string;
  apiTagKey?: string; // 对应 API Hub 中的模块 Key，如 "titan", "user", "itsm", "worker", "dashboard"
  color: string;
  tags: string[];
  upstreamIds: string[];
  downstreamIds: string[];
}

export interface InfraItemVO {
  id: string;
  name: string;
  code: string;
  role: string;
  port: string;
  protocol: string;
  description: string;
  tags: string[];
  color: string;
}

export interface DependencyEdgeVO {
  id: string;
  source: string;
  target: string;
  protocol: string;
  label: string;
  direction?: "down" | "right";
}

/**
 * 全量微服务与网关软件目录资产字典
 */
export const MICROSERVICES_CATALOG: ServiceItemVO[] = [
  {
    id: "gateway",
    name: "统一网关 BFF (Gateway)",
    code: "gateway",
    type: "gateway",
    port: 8888,
    protocol: "HTTP/REST",
    owner: "平台核心架构组",
    language: "Go 1.24+ / go-zero v1.10.3",
    domain: "统一对外流量入口、JWT 鉴权、RBAC 切面、跨 RPC 并发聚合 (mr.Finish) 与统一错误映射",
    description: "全栈 Monorepo 唯一对外暴露的 HTTP 8888 入口，严格阻隔外网直接触达底层微服务，禁止直连持久层。",
    protoPath: "app/gateway/desc/gateway.api",
    apiTagKey: "dashboard",
    color: "#722ed1",
    tags: ["HTTP :8888", "BFF 网关", "JWT Auth", "mr.Finish 聚合", "RESTful"],
    upstreamIds: ["portal-client", "admin-client"],
    downstreamIds: ["user-rpc", "worker-rpc", "itsm-rpc", "titan-rpc"],
  },
  {
    id: "user-rpc",
    name: "用户中心微服务 (User RPC)",
    code: "user.rpc",
    type: "rpc",
    port: 8080,
    protocol: "gRPC/Protobuf",
    owner: "身份与权限架构团队",
    language: "Go 1.24+ / go-zero v1.10.3",
    domain: "统一员工/客户画像、组织架构部门树、五级数据权限与角色-菜单-接口一石二鸟模型",
    description: "纯 gRPC 隔离运行，底层闭环用户凭证校验与动态 RBAC 权限推导，提供 Bcrypt 加密与 Session 事务一致性。",
    protoPath: "app/user/user.proto",
    apiTagKey: "user",
    color: "#1677ff",
    tags: ["gRPC :8080", "RBAC 鉴权", "双身份画像", "五级数据权限", "Session 事务"],
    upstreamIds: ["gateway"],
    downstreamIds: ["mysql", "redis", "nacos"],
  },
  {
    id: "worker-rpc",
    name: "异步任务调度微服务 (Worker RPC)",
    code: "worker.rpc",
    type: "rpc",
    port: 8082,
    protocol: "gRPC/Protobuf",
    owner: "分布式调度工程团队",
    language: "Go 1.24+ / go-zero v1.10.3 + Temporal SDK",
    domain: "基于 Temporal 的轻量分布式工作流编排、Cron 定时任务调度、多步骤 Saga 事务与状态机实时流转",
    description: "纯 gRPC 微服务且内置 Temporal Worker 执行器，监听指定 TaskQueue，为耗时任务与状态机流转提供毫秒级保障。",
    protoPath: "app/worker/worker.proto",
    apiTagKey: "worker",
    color: "#52c41a",
    tags: ["gRPC :8082", "Temporal 引擎", "Saga 分布式事务", "动态 Cron", "状态机流转"],
    upstreamIds: ["gateway"],
    downstreamIds: ["temporal", "mysql", "redis", "nacos"],
  },
  {
    id: "itsm-rpc",
    name: "ITSM 流程服务引擎 (ITSM RPC)",
    code: "itsm.rpc",
    type: "rpc",
    port: 8084,
    protocol: "gRPC/Protobuf",
    owner: "数字化流程治理团队",
    language: "Go 1.24+ / go-zero v1.10.3",
    domain: "BPMN 2.0 工业级流程引擎、动态表单配置、分布式 SLA 履约超时监控与工单全生命周期流转",
    description: "纯 gRPC 流程微服务，支持多分支会签、审批节点权限过滤、自动委托与 Temporal 分布式超时预警监控。",
    protoPath: "app/itsm/itsm.proto",
    apiTagKey: "itsm",
    color: "#fa8c16",
    tags: ["gRPC :8084", "BPMN 2.0", "SLA 履约监控", "动态表单", "全流程工单"],
    upstreamIds: ["gateway"],
    downstreamIds: ["temporal", "mysql", "redis", "nacos"],
  },
  {
    id: "titan-rpc",
    name: "Titan 交付微服务 (Titan RPC)",
    code: "titan.rpc",
    type: "rpc",
    port: 8086,
    protocol: "gRPC/Protobuf",
    owner: "云原生工程与交付团队",
    language: "Go 1.24+ / go-zero v1.10.3 + client-go",
    domain: "云原生交付矩阵、流水线 DAG 编排、K8s Helm 3 幂等升级、Jenkins 委托调度与发布单卡点治理",
    description: "纯 gRPC 交付微服务，原生集成 K8s 集群纳管、Helm Release 升级、YAML Server-Side Apply 与凭据加密保护。",
    protoPath: "app/titan/titan.proto",
    apiTagKey: "titan",
    color: "#13c2c2",
    tags: ["gRPC :8086", "CI/CD 流水线", "K8s & Helm", "Jenkins 编排", "发布单卡点"],
    upstreamIds: ["gateway"],
    downstreamIds: ["mysql", "redis", "nacos"],
  },
];

/**
 * 基础设施与中间件资产目录
 */
export const INFRA_CATALOG: InfraItemVO[] = [
  {
    id: "mysql",
    name: "MySQL 8.0 关系型数据库",
    code: "mysql",
    role: "主持久化事务存储引擎 (InnoDB)",
    port: "3306",
    protocol: "TCP / MySQL Native",
    description: "强一致 ACID 事务存储，支持带 TransactCtx 的多表原子变更，所有持久层由 DDL 逆向代码生成驱动。",
    tags: ["ACID 强一致", "事务隔离", "InnoDB", "DDL 驱动", "端口 3306"],
    color: "#00758f",
  },
  {
    id: "redis",
    name: "Redis 7.0 强一致缓存",
    code: "redis",
    role: "高性能分布式内存数据库 (Cache-Aside)",
    port: "6379",
    protocol: "TCP / RESP",
    description: "严格践行 Cache-Aside 强一致规范，单记录命中缓存，更新与删除严格由 CachedConn 精准淘汰 Key，彻底防击穿与雪崩。",
    tags: ["Cache-Aside", "毫秒级响应", "防击穿", "CachedConn", "端口 6379"],
    color: "#dc382d",
  },
  {
    id: "temporal",
    name: "Temporal 分布式任务引擎",
    code: "temporal",
    role: "工业级分布式工作流与 Saga 事务协调器",
    port: "7233 (gRPC) / 8233 (Web)",
    protocol: "gRPC / Protobuf",
    description: "长耗时任务编排、多步骤状态机流转、SLA 超时监控、自动指数避退重试与毫秒级全链路调用历史记录追踪。",
    tags: ["分布式编排", "Saga 事务", "Web 控制台 :8233", "高可靠重试", "工作流追踪"],
    color: "#24292e",
  },
  {
    id: "nacos",
    name: "Nacos 2.x 服务注册与发现",
    code: "nacos",
    role: "动态服务寻址与配置治理中心",
    port: "8848",
    protocol: "HTTP / gRPC",
    description: "默认注册发现中心，微服务启停自动维系心跳租约，支持零代码改动平滑无缝切换为 Etcd 或直连模式。",
    tags: ["服务注册", "心跳租约", "平滑寻址", "Etcd 兼容", "端口 8848"],
    color: "#1890ff",
  },
];

/**
 * 拓扑调用链路定义
 */
export const TOPOLOGY_EDGES: DependencyEdgeVO[] = [
  // 接入层 -> 网关层
  { id: "e-portal-gw", source: "portal-client", target: "gateway", protocol: "HTTP/REST", label: "RESTful API (:8888)" },
  { id: "e-admin-gw", source: "admin-client", target: "gateway", protocol: "HTTP/REST", label: "RESTful API (:8888)" },

  // 网关层 -> gRPC 微服务层
  { id: "e-gw-user", source: "gateway", target: "user-rpc", protocol: "gRPC", label: "RPC (:8080)" },
  { id: "e-gw-worker", source: "gateway", target: "worker-rpc", protocol: "gRPC", label: "RPC (:8082)" },
  { id: "e-gw-itsm", source: "gateway", target: "itsm-rpc", protocol: "gRPC", label: "RPC (:8084)" },
  { id: "e-gw-titan", source: "gateway", target: "titan-rpc", protocol: "gRPC", label: "RPC (:8086)" },

  // 微服务层 -> 基础设施层
  { id: "e-user-mysql", source: "user-rpc", target: "mysql", protocol: "TCP", label: "SQL (3306)" },
  { id: "e-user-redis", source: "user-rpc", target: "redis", protocol: "RESP", label: "Cache (6379)" },
  { id: "e-worker-temporal", source: "worker-rpc", target: "temporal", protocol: "gRPC", label: "Temporal (7233)" },
  { id: "e-itsm-temporal", source: "itsm-rpc", target: "temporal", protocol: "gRPC", label: "SLA 超时监控" },
  { id: "e-titan-mysql", source: "titan-rpc", target: "mysql", protocol: "TCP", label: "SQL (3306)" },
];
