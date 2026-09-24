# titan-api-contract Specification

## Purpose

统一 Titan 网关 HTTP API 的对外契约：响应结构、分页约束与列表负载规格，保证与其他模块一致且不可被滥用。

## Requirements

### Requirement: 统一响应封装
Titan 全部网关 HTTP 接口 SHALL 使用与项目其他模块一致的标准响应封装：成功返回 `{code, msg, data}` 结构，参数校验失败返回参数错误（HTTP 400），下游业务错误码从 RPC 错误中透传。SHALL NOT 绕过统一封装直接输出裸 JSON。

#### Scenario: 成功响应结构一致
- **WHEN** 调用任意 Titan 列表或详情接口成功
- **THEN** 响应体为 `{code: 200, msg: "SUCCESS", data: {...}}` 标准结构

#### Scenario: 业务错误码透传
- **WHEN** 下游 RPC 返回业务错误（如资源不存在）
- **THEN** 网关响应保留该业务错误码与信息，而非通用 500

#### Scenario: 参数校验失败返回 400
- **WHEN** 请求参数不满足契约校验
- **THEN** 返回参数错误结果（HTTP 400），错误信息指向具体字段

### Requirement: 分页参数约束
Titan 全部列表接口的分页参数 SHALL 声明上限（单页最大 100 条）与统一默认值（默认 20 条）；超出上限的请求 SHALL 被校验拒绝或截断到上限。各列表接口的默认值 SHALL 一致。

#### Scenario: 超大分页被限制
- **WHEN** 用户请求 pageSize=100000
- **THEN** 请求被校验拒绝（400）或截断为上限值，服务不产生超大查询

#### Scenario: 分页默认值统一
- **WHEN** 不传分页参数调用任意 Titan 列表接口
- **THEN** 返回默认 20 条第一页数据

### Requirement: 列表负载裁剪
列表接口的响应 SHALL NOT 包含大体积负载字段（如应用列表不含部署模板与构建配置全文、执行列表不含运行时参数与产物 JSON 全文）；此类字段仅由对应的详情接口返回。

#### Scenario: 应用列表不含部署模板
- **WHEN** 用户分页拉取应用列表
- **THEN** 列表项不含 deploy_spec、build_config 大字段，响应体保持轻量

#### Scenario: 详情接口返回完整字段
- **WHEN** 用户查询应用详情
- **THEN** 详情包含部署模板与构建配置全文
