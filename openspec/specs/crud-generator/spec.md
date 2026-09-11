# crud-generator Specification

## Purpose

提供从 MySQL 实体数据表一键逆向生成包含 Model、微服务 RPC、网关 BFF、前端 SDK 与 Ant Design ProTable 页面的全栈 CRUD 自动化工程脚手架。

## Requirements

### Requirement: 逆向解析数据表元数据
代码生成工具 SHALL 能够连接 MySQL 数据库或读取 DDL 文件，解析指定数据表的字段名、字段类型、注释信息、是否必填、主键与索引信息。

#### Scenario: 成功解析标准数据表
- **WHEN** 开发者执行代码生成命令并指定已有数据表（如 `sys_post`）
- **THEN** 生成器解析出表中各字段的 Go 类型、TypeScript 类型、表单控件类型与表元数据

#### Scenario: 指定不存在的数据表
- **WHEN** 开发者指定的表在数据库或 DDL 中不存在
- **THEN** 生成器终止执行并输出明确的错误提示信息

### Requirement: 自动生成后端微服务持久层与 RPC 契约
代码生成工具 SHALL 能够基于解析的表元信息，在指定微服务下生成遵循 Cache-Aside 强一致性规范的 Model 分页扩展，并在微服务 `.proto` 中追加标准 CRUD 消息体与 RPC 接口定义。

#### Scenario: 生成微服务 Model 与 RPC 代码
- **WHEN** 运行代码生成器处理目标数据表
- **THEN** 生成目标实体的自定义 Model 文件（带多条件筛选与动态分页），并在 proto 中生成包含 `Create`、`Update`、`Delete`、`Get`、`List` 的接口与 Logic 桩代码

### Requirement: 自动生成网关契约与路由
代码生成工具 SHALL 能够在网关契约 `desc/<service>.api` 中自动追加对应的 HTTP RESTful 路由声明，并生成调用下游微服务 RPC 的网关 Logic 与 Handler。

#### Scenario: 网关路由生成与编译验证
- **WHEN** 代码生成器完成网关层代码生成
- **THEN** 网关注册 `POST /api/v1/<service>/<entity>`、`PUT /api/v1/<service>/<entity>/:id`、`DELETE /api/v1/<service>/<entity>/:id`、`GET /api/v1/<service>/<entity>/:id` 与 `GET /api/v1/<service>/<entity>/list`，且网关可直接编译通过

### Requirement: 自动同步前端 SDK 与生成 ProTable 页面
代码生成工具 SHALL 自动调用 `just gen-ts` 同步前端 `@zero/api` SDK，并在管理后台 `apps/admin` 生成完全符合 Ant Design 6.x 与 ProComponents 规范的独立业务模块页面。

#### Scenario: 前端页面与组件合规性
- **WHEN** 生成前端业务模块页面
- **THEN** 页面包含多条件筛选表单、数据表格、新建/编辑 Modal 弹窗、详情抽屉、删除确认与操作日志审计，且通过 `just lint-antd` 静态检查，无任何废弃语法
