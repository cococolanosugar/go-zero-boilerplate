# Titan 研发交付系统全面评审报告

> 评审日期：2026-09-19
> 评审范围：`feat/devops` 分支 Titan 全链路（网关契约/Handler/Logic、Titan RPC Logic、Model、SQL Schema/Migration、`@zero/titan` 前端应用、admin 内嵌 Titan 页面）
> 评审方式：后端 / 数据模型与契约 / 前端三路并行审查，本文为合并结论
> 状态：**评审完成，待修复**（修复批次见 §6）

---

## 0. 总体结论

Titan 系统的**骨架与方向是正确的**：网关薄透传层合格（ctx 贯穿、走 RPC client、无 DB 依赖）；Model 生成代码与表结构逐列一致、全表带缓存且唯一键双淘汰；前端全量走 orval 生成的 `@zero/api` 强类型 SDK、`App.useApp()` 消费全局反馈贯彻到位、路由懒加载齐备。

但当前实现整体处于**"演示级"而非"生产级"**，存在三条贯穿三端的系统性主线问题：

| # | 主线问题 | 三端印证 |
| :--- | :--- | :--- |
| ① | **部署链路不可信**：K8s Apply 错误全部吞掉、假 RUNNING 状态、无归属校验、无幂等；前端伪造构建数据入库 | 后端 P0-1/P0-2 + 数据层 P1-3 + 前端 P1-8 |
| ② | **删除/更新缺少"资源归属与完整性"模型**：删除零级联零校验、projectId 被丢弃、Update 字段覆盖两种语义、零外键零软删 | 后端 P0-7/P0-8 + 数据层 P1-2 + 前端 P0-1 |
| ③ | **状态与契约缺少单一真源**：魔法字符串状态（HEALTHY vs ACTIVE 冲突）、DDL 三份手工同步、atlas 迁移链已断 | 后端 P1-16/P1-17 + 数据层 P0-1/P1-4/P2-16 |

---

## 1. P0 — 阻塞性 / 数据破坏 / 安全问题（必须修）

### 1.1 Atlas 迁移链已损坏【数据层】

- `manifest/sql/migrations/atlas.sum:1-16`：最后一条记录是 `20260914000001_align_itsm_timestamps.sql`，**`20260918000000_create_titan_tables.sql` 与 `20260919000000_titan_zadig_model.sql` 均未被收录**。
- 后果：任何新环境执行 `atlas migrate apply / status` 都会因目录校验和不一致直接报错，Titan 表在新环境永远无法通过 migration 创建。
- 修复：`atlas migrate hash --dir file://manifest/sql/migrations` 重新生成 sum，并纳入 CI 防回归。

### 1.2 部署流程"假成功"【后端】

- `app/titan/rpc/internal/logic/titan/deployartifactlogic.go:62-67`：`BuildConfigFromKubeconfig`、`NewClusterManager` 任一步失败均静默跳过，直接落到 DB 更新并返回 "Successfully deployed"。
- `:68`：`_, _ = mgr.ApplyYaml(...)` 完全丢弃 K8s Apply 错误。
- `:83/:85`：binding 的 `Update/Insert` 错误同样丢弃——DB 绑定记录可能没写入。
- `:79,91`：apply 失败也把 `titan_env_app_binding.status` 置 `RUNNING`、`ReadyReplicas=2`，环境大盘展示**假健康状态**。
- **用户看到部署成功，实际可能什么都没发生。**

### 1.3 deploy 无归属校验，可跨项目/跨应用部署【后端】

- `deployartifactlogic.go:32-50`：只分别 FindOne env/app/artifact/cluster，从不校验 `artifact.AppId == app.Id`、`app.ProjectId == env.ProjectId`，也不校验 `app.Status==1`、`artifact.Status=="AVAILABLE"`。
- 可把 A 项目应用的镜像部署到 B 项目环境（跨项目污染）。
- 附加：`:52` 用 `fmt.Sprintf` 拼全镜像名，`image_url`/`deploy_spec` 未做格式校验直接进 K8s YAML `text/template` 渲染——**模板注入**，配合 server-side apply 可创建任意集群资源。

### 1.4 SSRF：testIntegration 可探测内网【后端】

- `app/titan/rpc/internal/logic/titan/testintegrationlogic.go:106-119 / :154-168`：用户提交的 `serverAddr`/`portalUrl` 拼出 URL 后由 RPC 服务端直接发起 HTTP GET（仅默认补 `http://` 前缀），无内网地址黑名单，可探测 `169.254.169.254`、内网 K8s/DB 等任意地址。
- `:130/:180`：内部 `err.Error()` 原样返回前端（信息泄露）。
- `:120/:125/:168/:175`：`req, _ := http.NewRequestWithContext` 错误被忽略。
- `:192-197`：unknown category 解密已失败仍返回 `Success:true`——**假阳性测试通过**。

### 1.5 删除操作零级联、零校验、非原子【后端 + 数据层】

- `app/titan/rpc/internal/logic/titan/deleteprojectlogic.go:27`：删项目不检查/清理其下 apps、envs、bindings，直接单表物理 Delete。
- `deleteenvlogic.go:27`：删环境不清理 `titan_env_app_binding`，运行态记录成孤儿，env live 大盘残留数据。
- `deleteapplogic.go:27`：删应用不清理 bindings、artifacts。
- 三个文件均无存在性检查，`model.ErrNotFound` 直接抛给网关（未转 `xerr.RecordNotFound`）。
- 网关侧 `app/gateway/internal/logic/titan/delete_app_logic.go:28-30`、`delete_env_logic.go:28-30` 只传 `req.Id`，**URL 中的 `projectId` 被丢弃**——知道任意 app id 即可跨项目删除。
- 数据层印证：10 张表无任何 FOREIGN KEY、无 `deleted_at`（`manifest/sql/titan_schema.sql` 全文件），孤儿数据必然产生。

### 1.6 Update 字段覆盖逻辑错误（optional 字段被强制清空）【后端】

- `app/titan/rpc/internal/logic/titan/updatepipelinelogic.go:54-55`：`p.Status = int64(in.Status)`、`p.Description = in.Description` 无条件覆盖——前端只传 displayName 时**流水线被强制停用（status=0）且描述被清空**。
- `updateintegrationlogic.go:47-48`：同样问题（Status 置 0、Description 清空）。
- `updateclusterlogic.go:50`：Description 无条件清空。
- `updateapplogic.go` / `updateenvlogic.go` / `updateprojectlogic.go` 采用"非空才更新"，与上面三个文件**同一套 API 两种语义**，且导致 description 无法被主动清空（反向缺陷）。

### 1.7 前端编辑应用静默丢失 integrationId【前端】

- `frontend/apps/titan/src/pages/Apps/index.tsx:205,223,238`：编辑弹窗 `form.setFieldsValue({ integrationId })` 写入，但表单**没有** `Form.Item name="integrationId"`——`validateFields()` 只返回已注册字段，`values.integrationId` 恒为 `undefined`，提交后应用绑定的集成凭据被清空。
- 同类：`Projects/index.tsx:520` 的 `initialValues={{ status: 1 }}` 也是死配置（Body 类型无该字段）。

### 1.8 前端列表页无竞态保护【前端】

- `Apps/index.tsx:86-111`、`Environments/index.tsx:101-137`、`Artifacts/index.tsx:50-90`、`contexts/ProjectContext.tsx:31-55`：均为 `async/await` 后直接 `setXxx(res.list)`，无 AbortController / 序列号 / stale 标记。快速切换项目时旧响应覆盖新数据，页面展示与选中项不一致。
- 连锁 bug：`ProjectContext.tsx:31-61` 的 `refreshProjects` 依赖 `[currentProjectId]` 且 effect 依赖 `[refreshProjects]`——**每次切换项目都重新拉取全量项目列表**。应改用 ref / 函数式 setState 切断依赖。

### 1.9 批量步骤插入无事务，留下"僵尸 RUNNING"执行【后端】

- `app/titan/rpc/internal/logic/titan/triggerpipelinelogic.go:66-104`：先 Insert exec（RUNNING），再循环逐条 Insert step，未用 `m.Trans` + session。任一 step 插入失败（错误被 `_, _ =` 吞掉）→ 执行记录永久停在 RUNNING、步骤缺失。
- `:84` `execId, _ := res.LastInsertId()` 错误忽略；`:88` `json.Unmarshal` 错误忽略（stages 非法 → 0 步骤照样"触发成功"）。
- `:58` `execNo` 用秒级时间戳+4 位随机数，高并发撞 `uk_exec_no` 唯一键会抛裸 1062。
- `:47-50` 未校验 `pipeline.Status==1`，停用的流水线仍可触发。

### 1.10 全部 42 个 Titan 网关 handler 未用统一响应封装【后端】

- `app/gateway/internal/handler/titan/*.go`（42 个文件）全部使用 `httpx.ErrorCtx` / `httpx.OkJsonCtx`（如 `create_project_handler.go:19,28`），违反 CLAUDE.md 4.2 的 `pkg/result.HttpResult` / `ParamErrorResult` 铁律。
- 后果：`{code,msg,data}` 统一包装丢失、gRPC status 错误透传逻辑不生效、与其他模块（dict 等）响应结构不一致。

### 1.11 encrypt 默认硬编码密钥【后端】

- `pkg/cryptox/aes.go:12`：`defaultKey = "titan-platform-secret-key"` 硬编码兜底。部署时漏配 `TITAN_ENCRYPTION_KEY`，所有 kubeconfig/Jenkins 凭据等于明文强度。
- 修复：生产环境缺 key 直接 fail-fast。

### 1.12 并发/幂等：取消与部署均存在 TOCTOU【后端】

- `cancelexecutionlogic.go:35-41`：状态检查与更新非原子，两个并发取消或"取消 vs 状态推进"可互相覆盖终态。应使用 `UPDATE ... WHERE status IN (...)` 带状态条件的原子更新。
- `deployartifactlogic.go:75-94`：同 env+app 并发部署时 FindOne 双双 miss、各自 Insert 撞 `uk_env_app` 唯一键（错误又被吞）；无"部署中"中间态，重复点击重复 Apply。

---

## 2. P1 — 规范违反（CLAUDE.md 铁律 / AntD 6 / i18n）

### 2.1 后端

| # | 问题 | 位置 |
| :--- | :--- | :--- |
| 1 | **Logic 层手写裸 SQL 约 20 处**：8 个 list logic 的 count/分页/Join 全在 Logic 层，Model custom 文件（11 个）全是空壳；`servicecontext.go:11,32` 还额外暴露 `SqlConn` 诱导绕过 Model。违反"复杂 SQL 必须在 `*_model_custom.go`"铁律。全模块 **0 事务** | `listprojectslogic.go:35-58`、`listappslogic.go:39-54`、`listartifactslogic.go:39-58`、`listclusters/executions/integrations/pipelines` 同模式、`listenvslogic.go:30,43`、`getprojectlogic.go:33,36`、`getenvlogic.go:39`、`getexecutiondetaillogic.go:64`、`getenvlivedetaillogic.go:56` |
| 2 | **N+1 查询**：listProjects 每项目 2 次 COUNT；listEnvs 每 env 1 次 Cluster FindOne + 1 次 COUNT；listArtifacts 每条制品 1 次 App FindOne；env live 大盘每 app 1 次 binding + 1 次 artifact + 1 次 K8s API | `listprojectslogic.go:60-66`、`listenvslogic.go:35-44`、`listartifactslogic.go:63-71`、`getenvlivedetaillogic.go:60-90` |
| 3 | **错误吞掉导致大盘假象**：`_ =` / `_, _ =` 丢弃 DB/K8s 错误，DB 抖动时"看似正常" | `getenvlivedetaillogic.go:39-43,57`、`testclusterlogic.go:58-68` |
| 4 | **FindOne 错误一律误报"不存在"**：未区分 `model.ErrNotFound` 与真实 DB 错误，DB 故障被吞成业务 404（10+ 处） | `updateintegrationlogic.go:29-32`、`updateclusterlogic.go:29-32`、`updatepipelinelogic.go:28-31`、`getpipelinelogic.go:28-31`、`testintegrationlogic.go:53-56`、`cancelexecutionlogic.go:30-33`、`approvesteplogic.go:28-31`、`getsteploglogic.go:30-33`、`testclusterlogic.go:30-33`、`listnamespaceslogic.go:30-33` |
| 5 | **分页无上限**：`titan.api` 全部 `pageSize` 仅 `default=20` 无 `range=1:100`（`:29-30,90-91,165-166,264-265,320-321,378-379,534-535`）；RPC 侧只兜底 `<=0`。可传 100000 拖垮服务；ListApps 默认 50 与其他接口 20 不统一 | `titan.api` + 各 list logic |
| 6 | **LIKE 通配符未转义**：`%`/`_` 输入破坏匹配语义 | `listprojectslogic.go:43-44`、`listpipelineslogic.go:47-48` |
| 7 | **proto 契约字段遗漏**：`ApproveStepReq.userId`/`CancelExecutionReq.userId` 已传但未落库（审批人无审计）；`GetAppReq/DeleteAppReq/GetEnvReq/DeleteEnvReq` 缺 projectId；`DeployArtifactReq` 无操作人；`ArtifactItem`/`ExecutionItem` 缺 `updateTime` | `titan.proto:311-313,317-319,409-411,446-448,538-553,584-588` |
| 8 | **listIntegrations 脱敏缺口**：仅脱敏 4 个固定 key（token/password/private_key/secret），`apiToken/apiKey/credentials` 漏网且大小写敏感；`Decrypt` 失败静默把**密文原文**当配置返回前端 | `listintegrationslogic.go:64-70` |
| 9 | **update Integration 全量替换 Config**：前端若把脱敏掩码值原样提交，密钥被掩码永久覆盖（应识别掩码跳过或显式重置） | `updateintegrationlogic.go` + `titan.api:19-24` |
| 10 | **CreateApp/Project/Env 无非空校验**（createcluster/integration/pipeline 有）；`createapplogic.go:32-35` 存在 no-op 死代码 | `createapplogic.go`、`createprojectlogic.go`、`createenvlogic.go` |
| 11 | **ApproveStep 语义错位**：审批通过把用户 comment 写入 `step.ErrorMsg`；通过后无下游状态推进（流水线引擎缺失） | `approvesteplogic.go:38-39` |
| 12 | **GetStepLog 假日志**：内容为运行时拼接 sampleLog，IsEnd 判定不含 RUNNING 导致前端无限轮询；真实 `logPath` 从未被读取 | `getsteploglogic.go:40-41,47,55` |
| 13 | **错误消息中英混杂**：deploy 全英文裸 error，其余全中文 `xerr.NewErrMsg("..." + err.Error())` 拼接，无法按码识别 | 各 logic |
| 14 | **UTF-8 BOM 污染**：后端十余个文件 + admin 侧 4 个 titan 页面首字节带 BOM | `delete_pipeline_logic.go` 等 |

### 2.2 数据层

| # | 问题 | 位置 |
| :--- | :--- | :--- |
| 1 | **状态枚举魔法字符串 + 词汇表冲突**：`RUNNING/PENDING/SUCCESS/FAILED/ABORTED/SKIPPED/AVAILABLE/ACTIVE` 全裸字符串；`titan_cluster.status` 默认 `'HEALTHY'` 但 init.sql 种子插 `'ACTIVE'`；`titan_env` 注释值域含 `DELETED` 与物理删除自相矛盾 | `titan_schema.sql:26`、`init.sql:804-806` + 各 logic |
| 2 | **init.sql 与 migration 种子互不补齐**：init.sql 只种 cluster/integration/pipeline 四表，migration 只种 Zadig 五表——只跑其一则 demo 数据断链（env.cluster_id 1-3 指向不存在的 cluster） | `init.sql:802-829`、`20260919000000_titan_zadig_model.sql:96-124` |
| 3 | **列表接口全量拉取大字段**：listApps 每行带 `deploy_spec`（整份 K8s YAML）+ `build_config`；listExecutions 带 `runtime_params`/`artifacts` JSON——分页 50 条响应可达数百 KB | `listappslogic.go:53`、`listexecutionslogic.go:57` |
| 4 | **Create 系列无外键存在性校验**：project/cluster/app 可传任意值，只能靠 DB 约束报裸 1062 或静默成功 | `createenvlogic.go` 等 |

### 2.3 前端

| # | 问题 | 位置 |
| :--- | :--- | :--- |
| 1 | **AntD 6 废弃 API**（`just lint-antd` 必然报警）：`Space direction` 7 处（应为 `orientation`）、`Statistic valueStyle` 6 处（铁律明令禁止）、`Modal destroyOnClose` 7 处（应为 `destroyOnHidden`）；同仓库新旧混用；`Spin description` 拼错不生效（应为 `tip`） | `Projects:127-159,324,332,518`、`Apps:717,871`、`Environments:494,739,792,855`、`Artifacts:134,158,259`、`Pipelines:227,269,427`、`ExecutionDetail:374` |
| 2 | **i18n 三语形同虚设**：locale 文件 24 个 key 三语对齐，但所有页面文案/表单 label/message 硬编码中文；`TitanLayout` 菜单硬编码忽略 `routes.ts` 的 locale 元数据；`titan.header.*` key 已定义却未使用 | 全部页面 + `TitanLayout.tsx:92-186` |
| 3 | **Mock 混入真实链路**：构建制品用 `Math.random()` 伪造 gitCommit/sha256 直接入库；环境"重启"按钮只弹 message 无 API；项目环境链路 DEV/STAGING/PROD Badge 写死 | `Apps:272-300`、`Environments:622-628,706-713`、`Projects:300-306` |
| 4 | **admin 与 titan 约 2300 行双份代码**：Clusters 逐字节相同（484 行）、DesignerModal 相同（543 行）、Pipelines/Integrations **已分叉**（titan 版新增功能 admin 没有） | `frontend/apps/admin/src/pages/Titan/` vs `frontend/apps/titan/src/pages/` |
| 5 | **错误处理两套模式**：部分页面 console.error 无感（绕过全局 `requestErrorConfig`），部分走 ProTable request + message.error；`copyToClipboard` 三处重复实现（`@zero/shared` 已有现成） | `Apps:106-107,315-318`、`Environments:119-134,323-326`、`Artifacts:63-80,119-122`、`ProjectContext:50-51` |
| 6 | **硬编码 URL**：`:3000/:3001/:8888/:3002` 端口散落，应走 `import.meta.env` | `TitanLayout.tsx:175,184,255`、`admin/.../Workspace/index.tsx:38,71-119` |
| 7 | **死代码**：`src/access.ts` 无引用（umi 残留）、`iconMap` 未使用、`routes.ts` 的 name/locale/icon/hideInMenu 字段被 RouteRenderer 忽略、7 个页面约 25 个未使用导入、`catch (err: any)` 25 处 | 各页面 |
| 8 | **表单校验不完整**：buildConfig/deploySpec/runtimeParams 无 JSON/YAML 格式校验、namespace 无 DNS-1123 校验、apiEndpoint 无 URL 校验、slug 正则重复定义且未限长度 | `Apps:838-852`、`Pipelines:446-452`、`Environments:774-780`、`Clusters:394-400` |

---

## 3. P2 — 结构性优化与重构建议

### 3.1 后端

1. **部署异步化到 Temporal**：当前同步 Apply 受集群 RTT 影响；项目已有 `app/worker` Temporal 体系，exec 表已有 `workflow_id` 字段（当前填假值 `wf-...`）。
2. **时间格式化去重**：`CreateTime.Format("2006-01-02 15:04:05")` + NullTime 判空样板在 15+ 文件重复，抽 `formatTime(sql.NullTime) string`。
3. **分页兜底样板**：5 行 page/pageSize 兜底在 8 个 list logic 重复，抽分页构造器；`LIMIT` 参数化。
4. **helper 去重**：`gateway/logic/titan/helper.go` 的 `getUserIdFromCtx` 与 itsm 版及 user logic 内联版三份重复，上移公共包。
5. **唯一号生成**：`math/rand` 换 snowflake/uuid；ExecNo 格式与种子数据不一致。
6. **env live 大盘演示假数据**：无 Pod 时伪造 Pod 名，加 demo 标记或移除。
7. **API 寻址统一**：`/envs/:id/live`、`/envs/:id/deploy` 与 `/projects/:projectId/envs/:id` 两套寻址并存，建议统一带 projectId。

### 3.2 数据层

1. **冗余索引**：`idx_project_id`（`titan_schema.sql:129,144`）被 `uk_proj_app`/`uk_proj_env` 最左前缀覆盖、`idx_env_id`（`:181`）被 `uk_env_app` 覆盖，纯写放大可删。
2. **索引失效**：`LOWER(category)=LOWER(?)` 使 `idx_category` 失效（约定存小写后直接 `=`）；`LIKE '%kw%'` 量大需前缀匹配或全文索引。
3. **`titan_pipeline_step_exec` 补 `update_time`**：审批后无变更时间可审计。
4. **`titan_integration.name` 补唯一约束**：当前同名凭证可重复创建。
5. **DDL 单一真源**：`titan_schema.sql` / `init.sql` / migration 三份手工同步，建议以 migration 为唯一真源派生 schema.sql；种子统一 `INSERT IGNORE` 幂等风格（init.sql 菜单硬编码 id 70-77 有改写他行风险）。
6. **int64 ID 精度**：openapi 导出补 `format: int64`，前端留意 JS 2^53 精度。

### 3.3 前端

1. **CRUD 公共层**：modalOpen + submitting + Form + handleOpenCreate/Edit/Submit 模式重复 6 遍，抽 `useCrudModal<T>` hook 或 `CrudModal` 组件（可删约 500+ 行）；双视图（card/table Segmented）工具栏同理抽 `DualViewToolbar`。
2. **状态映射常量化**：`statusTagMap`/`execStatusMap`/env 映射 4 处重复且两份略有差异，集中到 constants（与后端状态常量包对齐口径）。
3. **批量发布优化**：准备阶段每 app 一次 `titanListArtifacts`（N+1 请求）；执行阶段逐个 `await` 串行、一个失败中断剩余——改 `Promise.allSettled` + 结果汇总，或后端出批量接口。
4. **轮询体验**：ExecutionDetail 每 4 秒 `setLoading(true)` 整页 Spin 闪烁——区分首次加载与轮询静默刷新，加 `document.visibilityState` 暂停与退避；`setTimeout(reload, 100)` 时序 hack 改 `manualRequest`/`params` 联动。
5. **ProjectContext 健壮性**：`localStorage` 初始化 `Number()` 需 `Number.isFinite` 保护；`setCurrentProjectId` 补 useCallback；value 对象补 useMemo。
6. **可达性**：菜单项 `div onClick` 无键盘可达性，改 `<a>` 或 role。
7. **首包体积**：`chunkSizeWarningLimit: 2500` 偏大，关注拆包。

---

## 4. 正面确认（无需改动）

- **网关 titan logic**（create/list/get/delete 系列）是合格的薄透传层：ctx 贯穿、RPC 走 client、无 DB 依赖。
- **Model `_gen.go`**：与表结构逐列一致（bigint→int64、可空 datetime→sql.NullTime），全部 11 个 model 带 cache 且 id + 唯一键双缓存淘汰，Update/Delete 走 `CachedConn` 符合铁律。
- **时间字段**：由 DB `DEFAULT CURRENT_TIMESTAMP / ON UPDATE` 管理，Insert/Update SQL 正确剔除时间列，无代码双写。
- **proto ↔ titan.api ↔ types ↔ openapi**（24 条 titan 路径）逐项比对一致；网关 JWT 注入（triggerBy/userId/ownerId）映射正确。
- **前端接口层**：全量走 orval 生成 `@zero/api` 强类型 SDK，无手写拼接；`App.useApp()` 贯彻无全局静态调用；`requestErrorConfig.ts` 全局错误处理器存在；路由 `React.lazy` 懒加载齐备；admin→titan iframe 收敛方向正确。

---

## 5. 修复批次建议

| 批次 | 内容 | 预估 | 理由 |
| :--- | :--- | :--- | :--- |
| **1（立即）** | `atlas migrate hash` 修迁移链并纳入 CI；42 个 handler 换 `pkg/result`；cryptox 缺 key fail-fast；批量去 BOM | ~半天 | 小改动、阻塞性、防生产事故 |
| **2（本迭代）** | deploy 归属校验 + 错误不吞 + 幂等/中间态；Update 字段覆盖 bug；删除级联/拒绝策略 + projectId 归属校验；trigger 事务化；SSRF 黑名单；前端 integrationId 丢失 + 竞态保护 + ProjectContext 依赖链 | 2-3 天 | 数据正确性，改动集中 |
| **3（下一迭代）** | SQL 下沉 Model custom 文件 + 事务化；N+1 消除；状态常量包（统一 HEALTHY/ACTIVE）；脱敏增强；pageSize 上限 + LIKE 转义；AntD 6 废弃 API；i18n 实装；种子数据幂等对齐 | 3-5 天 | 规范债，面积大但机械 |
| **4（规划）** | 部署异步化到 Temporal；admin/titan 抽 `@zero/titan-ui` 共享包；CRUD 公共层；列表剔除大字段；批量发布接口；软删方案设计 | 按迭代排期 | 结构性重构 |

---

## 6. 附：本次评审涉及的改动文件

- 网关：`app/gateway/desc/titan.api`、`app/gateway/internal/handler/titan/`（42 个新文件）、`app/gateway/internal/logic/titan/`（21 个新文件 + helper.go）
- Titan RPC：`app/titan/rpc/titan.proto`、`app/titan/rpc/internal/logic/titan/`（21 个新文件）、`internal/svc/servicecontext.go`
- Model：`app/titan/model/`（11 组 model 新文件）
- SQL：`manifest/sql/titan_schema.sql`、`manifest/sql/init.sql`、`manifest/sql/migrations/20260919000000_titan_zadig_model.sql`
- 前端：`frontend/apps/titan/src/`（pages/contexts/router/layouts/locales）、`frontend/apps/admin/src/pages/Titan/`、`frontend/packages/api/src/`（endpoints + 26 个新 model）
- 公共库：`pkg/cryptox/aes.go`
