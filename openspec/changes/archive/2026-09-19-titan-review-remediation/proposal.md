# Titan 评审整改（P0+P1）提案

## Why

2026-09-19 对 Titan 研发交付系统（`feat/devops` 分支）的三路全面评审（后端 / 数据契约 / 前端，报告见 `doc/reports/2026-09-19-titan-system-review.md`）发现当前实现处于"演示级"而非"生产级"：存在 12 项 P0 阻塞性/数据破坏问题（部署假成功、跨项目越权删除与部署、SSRF、Atlas 迁移链损坏等）与 26 项 P1 规范违反（Logic 层裸 SQL、N+1、AntD 6 废弃 API、i18n 形同虚设等）。这些问题不修复，Titan 无法承载真实交付流程，且部分问题（迁移链损坏、密钥硬编码）会在部署到新环境时直接造成事故。

## What Changes

按评审报告的批次 1-3 整改（批次 4 结构性重构——部署异步化 Temporal、`@zero/titan-ui` 共享包抽取、软删方案——不在本变更范围，另行立项）：

**批次 1（阻塞修复）**
- 修复 Atlas 迁移链：`atlas migrate hash` 重新生成 `atlas.sum`，补 CI 校验
- 42 个 Titan 网关 handler 从 `httpx.OkJsonCtx/ErrorCtx` 迁移到 `pkg/result` 统一响应封装
- `pkg/cryptox` 生产环境缺失 `TITAN_ENCRYPTION_KEY` 时 fail-fast，移除硬编码默认密钥
- 批量清理后端与 admin 前端文件的 UTF-8 BOM

**批次 2（数据正确性修复）**
- 部署链路：补资源归属校验（artifact→app→env→project 逐级校验）、K8s Apply 与 binding 写库错误不再吞掉、消除假 RUNNING 状态、引入部署幂等与中间态、镜像名与 deploy_spec 渲染前校验
- 删除链路：删项目/环境/应用改为"有子资源时拒绝删除或事务级联清理"（明确策略）、网关传递 projectId 并在 RPC 侧做归属校验、ErrNotFound 转业务错误码
- Update 语义统一：全部 Update 采用"显式传值才更新"（proto 增加 optional/wrapper 或指针语义），消除 Status/Description 被静默清空
- 流水线触发事务化：exec + steps 同事务写入、停用流水线不可触发、ExecNo 换雪花 ID
- SSRF 防护：testIntegration/testCluster 的出站地址加内网/元数据地址黑名单，内部错误信息不再透出
- 前端：修复编辑应用丢失 integrationId、列表竞态保护（stale 标记/AbortController）、ProjectContext 依赖链修复、设计器保存失败提示

**批次 3（规范债清理）**
- SQL 下沉：约 20 处 Logic 层裸 SQL 迁入 `app/titan/model/*_model_custom.go`，N+1 改批量聚合（GROUP BY / WHERE IN）
- 状态常量单一真源：新建 Titan 状态常量包，统一 HEALTHY/ACTIVE 词汇冲突，消除魔法字符串
- 分页治理：`titan.api` 全部 pageSize 加 `range=1:100`，统一默认值；LIKE 关键字转义；列表接口剔除 deploy_spec 等大字段
- 凭据脱敏增强：按 key 子串与大小写不敏感匹配、解密失败不再静默回退密文、update 时识别掩码值跳过
- 种子数据幂等对齐：init.sql 与 migration 种子统一 `INSERT IGNORE` 风格并互相补齐
- 前端规范：AntD 6 废弃 API 全量替换（Space orientation / destroyOnHidden / 移除 valueStyle）、i18n 实装（页面文案接入 locale，TitanLayout 菜单走 routes.ts 元数据）、错误处理统一走全局处理器与 message、`copyToClipboard` 收敛到 `@zero/shared`、硬编码端口改环境变量、表单 JSON/YAML/DNS-1123/URL 校验

## Capabilities

### New Capabilities

- `titan-deployment-integrity`: 部署与流水线执行链路的行为契约——资源归属校验、错误真实传播、部署状态真实反映集群实际、幂等与中间态、执行记录事务一致性
- `titan-resource-lifecycle`: 项目/应用/环境/制品等资源的生命周期契约——删除保护与级联策略、更新字段语义（显式传值才更新）、存在性与归属校验、状态枚举单一真源
- `titan-security-hardening`: 安全契约——出站请求 SSRF 防护、凭据脱敏与解密失败处理、加密密钥 fail-fast、内部错误信息不外泄
- `titan-api-contract`: 网关 API 契约——统一响应封装、分页上限与默认值、列表负载裁剪（不含大字段）
- `titan-frontend-conformance`: 前端行为契约——i18n 语言切换生效、AntD 6 合规、列表竞态保护、表单数据完整性（编辑不丢字段）与格式校验、操作失败必有用户可见反馈

### Modified Capabilities

- `database-migrations`: 新增"Atlas 迁移目录完整性"要求——所有 migration 文件必须被 `atlas.sum` 收录，CI 强制校验，防止迁移链损坏

## Impact

- **后端**：`app/gateway/internal/handler/titan/`（42 文件改响应封装）、`app/gateway/internal/logic/titan/`（projectId 透传）、`app/gateway/desc/titan.api`（分页 range、路由归属）、`app/titan/rpc/internal/logic/titan/`（全部 logic 整改）、`app/titan/rpc/internal/svc/servicecontext.go`（移除 SqlConn 暴露）、`app/titan/model/`（custom 文件补齐批量/分页/聚合方法）、`app/titan/rpc/titan.proto`（update 语义、归属字段、操作人审计字段，需重新 gen-rpc + gen-gateway + gen-ts）
- **公共库**：`pkg/cryptox/aes.go`（fail-fast）、可能新增 `pkg/` 或 titan 内部状态常量包、时间格式化公共函数
- **数据层**：`manifest/sql/migrations/atlas.sum`（重新生成）、init.sql 与 migration 种子幂等对齐、`titan_integration.name` 唯一约束、`titan_pipeline_step_exec` 补 update_time（新 migration）
- **前端**：`frontend/apps/titan/src/`（全部页面 + layouts + contexts + locales）、`frontend/apps/admin/src/pages/Titan/`（BOM 与废弃 API）、`frontend/packages/api/src/`（重新生成 SDK）
- **CI**：新增 atlas.sum 完整性校验步骤
- **风险**：proto update 字段语义调整对前端已上线调用方是 **BREAKING**（Update 系列接口字段不传即不变，而非清空）；响应封装统一会改变 Titan HTTP 接口的响应体外层结构（从裸 JSON 到 `{code,msg,data}`），前端 SDK 需同步重新生成
