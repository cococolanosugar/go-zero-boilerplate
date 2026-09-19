# Titan 评审整改（P0+P1）技术设计

## Context

评审报告（`doc/reports/2026-09-19-titan-system-review.md`）已定位全部问题坐标。整改横跨网关、Titan RPC、Model、SQL、前端与 CI 六个面，且涉及 proto 契约变更引发的重新生成链（gen-rpc → gen-gateway → gen-ts）。现有工程约束：

- goctl `api go` 只创建缺失文件、不覆盖已有 handler——dict 模块的手工 `pkg/result` 改造因此得以长期存活，Titan 42 个 handler 可走同样路径。
- proto3 `optional` 字段经 protoc-gen-go 生成指针类型，是 goctl 生态下"字段显式提供才更新"语义的标准实现。
- CI（`.github/workflows/ci.yml`）已有 Go 测试构建与前端 lint 两个 job，可低成本挂载迁移目录校验。
- Titan 的 Model `_gen.go` 生成质量合格（缓存、双淘汰），问题集中在 Logic 绕过 Model 直连 `SqlConn`。

## Goals / Non-Goals

**Goals:**

- 全部 P0（12 项）与 P1（26 项）整改落地，行为满足 6 个能力 spec。
- proto/API 契约变更一次到位，避免多次 BREAKING。
- 重新生成链（gen-rpc/gen-gateway/gen-ts）后零手工遗漏。

**Non-Goals:**

- 部署异步化到 Temporal、admin/titan 抽 `@zero/titan-ui` 共享包、软删方案——批次 4 另行立项。
- 流水线真实执行引擎（步骤调度、日志流）——本变更只修事务一致性与状态机正确性。
- GetStepLog 真实日志读取、ApproveStep 下游推进——引擎缺失属批次 4 范畴，本变更仅消除假日志/无限轮询的显性缺陷。

## Decisions

### D1: Update 显式语义用 proto3 `optional` 指针字段

`titan.proto` 的 Update 请求中所有可选更新字段（status、description、displayName 等）声明为 `optional`，生成 Go 指针字段；RPC logic 以 `in.Field != nil` 判定是否更新，未提供即保持原值，显式提供零值/空串即清空。

- 备选：前端全量回传（依赖调用方自觉，多端调用必踩坑）或 wrapper message（goctl 生成体验差）。指针方案是 gRPC 生态标准做法。
- **BREAKING**：SDK 重新生成后，前端 Update 调用需改为传 `undefined` 表示"不更新"——`@zero/api` orval 生成类型会自然暴露差异，前端任务中同步适配。

### D2: 删除策略 = 默认拒绝，不做级联

删项目/环境/应用前检查子资源（Count > 0 即返回 `xerr` 业务错误，消息指明存在的子资源类型）；无子资源才物理删除。不引入 `force` 级联参数（留批次 4 与软删方案一并设计）。理由：拒绝删除语义最安全、实现最小，且与"物理删除 + 零外键"的现状容错最好。

### D3: 归属校验靠 proto 补 projectId，网关透传

`GetAppReq/DeleteAppReq/GetEnvReq/DeleteEnvReq` 增加 `projectId` 字段，网关 logic 从 path 取值透传；RPC logic 校验 `resource.ProjectId == req.ProjectId`，不符返回记录不存在（不泄露资源存在性）。`DeployArtifactReq` 同步补 `projectId` + `operatorId`（审计线索，与 triggerBy 模式一致）。

### D4: 部署幂等用 binding 状态条件原子更新做"部署锁"

部署前执行 `UPDATE titan_env_app_binding SET status='DEPLOYING' WHERE env_id=? AND app_id=? AND status!='DEPLOYING'`（新增 `status: DEPLOYING` 枚举值）：

- 影响行数 = 0 → 已有部署进行中，拒绝；binding 不存在则插入一条 DEPLOYING 记录。
- 拿到锁后执行校验链（归属/状态/输入）→ K8s Apply → 按真实结果置 `RUNNING`/`FAILED`（FAILED 时回写可读错误信息）。
- 任一步失败不再吞错，全部上抛；Apply 结果决定绑定状态，`ReadyReplicas` 仅在 Apply 成功后从集群回读，无回读能力时置 0 而非虚构。
- 同步 Apply 保留（异步化属批次 4），但接口语义已正确。

### D5: 状态常量单一真源 = `app/titan/model/status.go` + migration 统一词汇

后端：`app/titan/model/status.go` 集中定义全部状态常量（执行/制品/绑定/集群/环境/流水线），logic 与判断全部引用常量。集群状态统一采用 `HEALTHY`（schema 默认值），新 migration 将种子数据的 `ACTIVE` 修正为 `HEALTHY`；环境状态注释值域去掉 `DELETED`。前端在 `@zero/titan` 建 `src/constants/status.ts` 与后端口径对齐（4 处散落映射收敛）。

### D6: SQL 全量下沉 Model custom 文件，svc 摘除 SqlConn

11 个 `*_model_custom.go` 补齐：`FindByPage`、`Count`、`CountAppsAndEnvsByProject`（GROUP BY 聚合）、`FindByEnvId`（binding 批量）、`FindByIds`（批量取 app/artifact）、列表专用轻量列 SELECT（剔除 deploy_spec/build_config 等大字段）。`servicecontext.go` 删除 `SqlConn` 字段，强制 logic 只能走 model。分页兜底与 `LIMIT` 参数化抽 `pkg` 或 model 层分页构造器（page/pageSize 归一 + 参数占位）。时间格式化抽 `formatTime(sql.NullTime) string` 公共函数。

### D7: SSRF 防护 = Titan 内部 guard 包

`app/titan/rpc/internal/guard/ssrf.go`：对目标地址做 DNS 解析后逐 IP 校验，拒绝环回/私有网段/链路本地/组播/保留地址（覆盖 `169.254.169.254` 及其域名形式）。放在 titan internal 而非 `pkg/`——当前仅 Titan 出站测试需要，避免过早公共化；将来第二处复用再上移。testIntegration/testCluster 调用前强制过 guard；连通性失败返回概括性原因（不可达/超时/拒绝），不透出 `err.Error()` 原文。

### D8: 脱敏按 key 子串大小写不敏感匹配 + 掩码跳过约定

- 掩码统一格式 `****`（后 4 位明文可选保留，如 `****abcd`）。敏感 key 判定：小写化后包含 `token|key|secret|password|passwd|credential|private` 任一子串。
- listIntegration：解密失败的配置返回字段级错误标记（前端显示"无法解密"），不回退密文。
- updateIntegration：提交值匹配 `^\*{4}` 掩码模式时跳过该 key，保留库中原值。

### D9: cryptox 生产 fail-fast

`pkg/cryptox` 初始化时：key 未配置且进程处于生产模式（沿用项目 confx/服务 env 判定）→ 启动 panic 并输出配置指引；开发模式允许默认 key 但打 WARN 日志。移除硬编码默认 key 作为静默兜底的路径。

### D10: handler 迁移与迁移目录校验

- 42 个 titan handler 手工改为 `result.ParamErrorResult` + `result.HttpResult`（与 dict 模块同构；goctl 不覆盖已有文件）。
- `atlas migrate hash --dir file://manifest/sql/migrations` 重新生成 sum；CI 在 Go job 前加一步：执行 hash 后 `git diff --exit-code -- manifest/sql/migrations/atlas.sum`，未收录即构建失败。

### D11: 新 migration 内容

单个新 migration `2026xxxx_titan_review_fixes.sql` 承载：`titan_integration.name` 唯一索引、`titan_pipeline_step_exec.update_time` 列、集群种子状态 `ACTIVE`→`HEALTHY` 修正、（若 D4 需要）binding `status` 值域注释更新。同步更新 `titan_schema.sql` 与 init.sql 种子（幂等 `INSERT IGNORE`，两条引导路径种子互相补齐）。

## Risks / Trade-offs

- [Update optional 指针字段是 BREAKING] → 前端任务中显式适配（`undefined`=不变），SDK 重新生成后 TS 编译期即可暴露全部漏改点；manifest/openapi 同步再生成。
- [部署 DEPLOYING 锁无超时释放：进程崩溃后 binding 卡在 DEPLOYING] → 本变更接受该窗口（同步 Apply，进程崩溃时 K8s 侧也无结果）；批次 4 异步化时引入锁超时。运营兜底：提供手工状态修复入口或 SQL 说明，记入变更说明。
- [删除改拒绝策略对已有 demo 数据的影响：种子数据含绑定关系，演示删除会报错] → 可接受；错误消息明确提示先删子资源，演示路径反而更真实。
- [SQL 下沉与 N+1 改批量是一次大面积 logic 重写，回归风险集中] → tasks 按"一个 model 一个任务"拆分，每步 `go build ./...` + `go test ./app/...`；list 接口用 curl 冒烟（响应结构变化后同步验证 result 封装）。
- [SSRF guard 的 DNS rebinding（校验时解析 A、请求时解析 B）] → 本变更以"解析后校验 + 拒绝非常规地址"为基线；guard 内将校验与请求共用一次解析结果（自定义 Dialer 校验连接时 IP）为增强项，记入任务但标注可选。
- [atlas hash 重新生成会重写既有条目格式] → 仅当目录文件被篡改时 hash 才报错；正常重生成只追加新条目，风险低。

## Migration Plan

1. 合并顺序：先合后端 proto/SQL 变更与重新生成产物（gen-rpc → gen-gateway → gen-ts 同一提交），再合前端适配，避免中间态 SDK 与后端不一致。
2. 已有环境：执行新 migration（唯一索引/列/种子修正）无破坏性；`atlas.sum` 重生成后 `atlas migrate status` 应恢复干净。
3. 回滚：migration 提供DOWN 或按项目惯例（评审确认现有 migration 无 DOWN 段，沿用现状）；代码回滚即 git revert，无数据格式迁移。

## Open Questions

- 批量发布接口（前端 N+1 + 串行发布问题）在后端补批量查询还是仅前端 `Promise.allSettled` 优化？倾向后者（行为不变、改动最小），实现时确认。
