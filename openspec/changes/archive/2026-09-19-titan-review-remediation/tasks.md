# Titan 评审整改（P0+P1）任务清单

## 1. 契约变更与代码生成链（一切任务的前置）

- [x] 1.1 修改 `app/titan/rpc/titan.proto`：Update 系列（project/app/env/cluster/integration/pipeline）可选字段声明为 `optional`；`GetAppReq/DeleteAppReq/GetEnvReq/DeleteEnvReq` 补 `projectId`；`DeployArtifactReq` 补 `projectId` 与 `operatorId`；`ArtifactItem`/`ExecutionItem` 补 `updateTime`；统一集成/集群/流水线字段为 snake_case。验证：`just gen-rpc titan` 生成无错，指针字段与新增字段出现在 pb.go
- [x] 1.2 修改 `app/gateway/desc/titan.api`：全部列表接口 `pageSize` 加 `range=1:100` 并统一默认 20；`GetApp/DeleteApp/GetEnv/DeleteEnv` 路由参数含 projectId；deploy 路由补 projectId；`DeployArtifactReqVO` 增加操作人透传。验证：`just gen-gateway` 无错，types 生成含新字段
- [x] 1.3 生成 SQL migration `2026xxxx_titan_review_fixes.sql`：`titan_integration.name` 唯一索引、`titan_pipeline_step_exec.update_time` 列、集群种子 `ACTIVE`→`HEALTHY`、binding status 值域注释补 DEPLOYING；同步更新 `titan_schema.sql` 与 `init.sql` 种子（幂等对齐，两条引导路径互相补齐）。验证：`atlas migrate hash` 后本地 `just migrate-up` 成功
- [x] 1.4 执行 `atlas migrate hash --dir file://manifest/sql/migrations` 重新生成 `atlas.sum`（收录两个 Titan migration 与新 migration）。验证：`atlas migrate status` 无校验和错误
- [x] 1.5 在 `.github/workflows/ci.yml` Go job 增加迁移目录校验步骤（atlas hash 后 `git diff --exit-code -- manifest/sql/migrations/atlas.sum`）。验证：故意新增未收录 migration 提交时 CI 失败（本地模拟执行该命令验证非零退出）

## 2. 批次 1：阻塞修复

- [x] 2.1 42 个 `app/gateway/internal/handler/titan/*.go` 从 `httpx.OkJsonCtx/ErrorCtx` 迁移到 `result.ParamErrorResult`/`result.HttpResult`（对齐 dict 模块写法）。验证：`grep -L "pkg/result" app/gateway/internal/handler/titan/*.go` 为空；curl 任一 titan 接口返回 `{code,msg,data}` 结构
- [x] 2.2 `pkg/cryptox` 生产环境缺 `TITAN_ENCRYPTION_KEY` 时启动 panic 并输出配置指引，开发模式保留默认 key 但打 WARN。验证：单元测试覆盖三种模式（生产无 key 拒启/生产有 key 正常/开发无 key WARN），`go test ./pkg/cryptox/...` 通过
- [x] 2.3 批量清理后端 titan logic 与 admin 前端 Titan 页面文件的 UTF-8 BOM。验证：`grep -rlP '^\xEF\xBB\xBF' app/titan app/gateway/internal/handler/titan frontend/apps/admin/src/pages/Titan` 为空
- [x] 2.4 抽公共 `formatTime(sql.NullTime) string` 时间格式化函数并替换 15+ 处重复样板。验证：`go build ./...` 通过，列表接口时间输出格式不变

## 3. 后端 P0：部署与流水线执行链路

- [x] 3.1 `deployartifactlogic.go` 重写：D4 部署锁（binding 状态条件原子更新置 DEPLOYING，抢锁失败拒绝）+ D3 归属校验链（artifact→app→env→project、app 启用、制品可用）+ 镜像引用与 deploy_spec 渲染前校验 + K8s Apply/binding 写库错误全量上抛 + 按真实结果置 RUNNING/FAILED。验证：单元测试覆盖"跨项目部署拒绝/Apply 失败返回失败/重复部署拒绝/成功置 RUNNING"四场景
- [x] 3.2 `triggerpipelinelogic.go`：exec + steps 同事务写入（`m.Trans`）；停用流水线拒绝触发；ExecNo 换雪花/uuid；stages 反序列化失败返回错误。验证：单元测试覆盖"步骤写入失败整体回滚/停用拒绝/stages 非法拒绝"
- [x] 3.3 `cancelexecutionlogic.go` 改带前置状态条件的原子 UPDATE（`WHERE status IN (可取消状态)`），影响行数 0 时返回已终态业务提示。验证：单元测试覆盖"并发取消恰一次生效/已完成不可取消"
- [x] 3.4 `getsteploglogic.go`：消除无限轮询（IsEnd 覆盖全部终态，进行中明确返回进行中标志），sampleLog 标记 demo 或移除。验证：轮询场景单元测试确认终态后停止拉取

## 4. 后端 P0：删除/更新/安全

- [x] 4.1 三个 delete logic 加子资源检查（Count>0 返回业务错误，消息指明子资源类型）+ 存在性检查（ErrNotFound → `xerr.RecordNotFound`）。验证：单元测试覆盖"含子资源拒绝/无子资源成功/不存在返回业务码"
- [x] 4.2 网关 delete/get app、env logic 透传 projectId 至 RPC（配合 1.1 的 proto 字段）；RPC 侧归属校验不符返回记录不存在。验证：单元测试覆盖"跨项目访问返回不存在"
- [x] 4.3 六个 update logic 改 D1 指针语义（`in.Field != nil` 才更新）。验证：单元测试覆盖"只传名称状态描述不变/显式空描述清空"，六类资源行为一致
- [x] 4.4 新建 `app/titan/rpc/internal/guard/ssrf.go`（DNS 解析后逐 IP 校验，拒绝环回/私有/链路本地/组播/保留地址），testIntegration/testCluster 调用前强制过 guard；连通性错误返回概括性原因，移除 `err.Error()` 透出与 `NewRequestWithContext` 忽略错误。验证：guard 单元测试覆盖元数据地址/私网/正常外网；unknown category 解密失败不再返回 Success
- [x] 4.5 十处 FindOne 错误处理修复：区分 `model.ErrNotFound` 与 DB 错误，DB 故障返回系统错误而非 404。验证：`go build ./...` + 相关 logic 单元测试通过

## 5. 后端 P1：状态常量、SQL 下沉与查询治理

- [x] 5.1 新建 `app/titan/model/status.go` 状态常量包（执行/制品/绑定/集群/环境/流水线全量常量），替换全部魔法字符串；binding 新增 `StatusDeploying`。验证：`grep -rn '"RUNNING"\|"PENDING"\|"SUCCESS"' app/titan/rpc/internal/logic/` 仅剩常量引用
- [x] 5.2 `servicecontext.go` 摘除 `SqlConn` 字段。验证：`go build ./...` 强制暴露所有引用点（配合 5.3-5.5 逐一下沉）
- [x] 5.3 各 `*_model_custom.go` 补分页与聚合方法（FindByPage/Count/CountAppsAndEnvsByProject GROUP BY），8 个 list logic 下沉；LIKE 关键字转义 `%`/`_`；分页构造器统一 page/pageSize 归一。验证：list 接口 curl 冒烟分页正确，`grep -n "SqlConn" app/titan/rpc/internal/logic/` 为空
- [x] 5.4 批量查询消除 N+1：listArtifacts 批量取 apps（WHERE IN）、listEnvs 批量取 clusters+count、getEnvLiveDetail 一次取 bindings+批量 artifacts、listProjects 聚合 count。验证：单元测试断言查询次数（可用计数 mock 或日志断言）
- [x] 5.5 列表接口剔除大字段：listApps 不查 deploy_spec/build_config（轻量列 SELECT），listExecutions 不查 runtime_params/artifacts JSON；详情接口保持全量。验证：curl list 接口响应不含大字段、详情接口包含
- [x] 5.6 脱敏增强（D8）：key 子串大小写不敏感匹配清单（token/key/secret/password/passwd/credential/private）；解密失败返回字段级错误标记不回退密文；updateIntegration 掩码值（`^\*{4}`）跳过。验证：单元测试覆盖漏网 key 脱敏/掩码提交不清空原值/解密失败标记
- [x] 5.7 创建系列补非空与外键存在性校验（createApp/createProject/createEnv/createArtifact 校验 name 非空、父资源存在），删除 createapplogic 死代码。验证：单元测试覆盖"空名拒绝/父资源不存在拒绝"

## 6. 前端修复（`@zero/titan` + admin Titan 页面）

- [x] 6.1 执行 `just gen-ts` 重新生成 SDK，全部 Update 调用点适配 optional 语义（不更新的字段传 `undefined`），修复编辑应用 integrationId 丢失（Form.Item 补 hidden 注册或提交时合并原值）。验证：`pnpm build` 通过，编辑应用保存后集成绑定不变（手测或组件测试）
- [x] 6.2 列表竞态保护：Apps/Environments/Artifacts 加载与 ProjectContext 增加请求序列号（stale 响应丢弃）；ProjectContext 依赖链修复（refreshProjects 用 ref 切断 currentProjectId 依赖，setCurrentProjectId/value 补 useCallback/useMemo，localStorage Number.isFinite 保护）。验证：快速切换项目最终展示新项目数据（手测或测试）
- [x] 6.3 AntD 6 废弃 API 全量替换：`Space direction`→`orientation`（7 处）、`Statistic valueStyle`→`styles.value`（6 处）、`Modal destroyOnClose`→`destroyOnHidden`（7 处）、`Spin description`→`tip`。验证：`just lint-antd` 零警告零废弃项
- [x] 6.4 i18n 实装：全部页面文案/表单 label/message 接入 locale key，三语文件补齐；TitanLayout 菜单改由 routes.ts 的 locale 元数据驱动，header 链接走 `titan.header.*` key，移除硬编码端口（`import.meta.env`）。验证：切换 English 后页面与菜单整体英文；三语 key 数量一致（脚本比对）
- [x] 6.5 错误处理统一：console.error 路径改走全局错误处理器或 message.error（与 ProTable 模式对齐）；设计器保存 catch 区分表单校验与请求失败并提示；`copyToClipboard` 收敛到 `@zero/shared`。验证：`grep -rn "console.error" frontend/apps/titan/src/pages` 为空；断网保存设计器出现失败提示
- [x] 6.6 表单校验补齐：buildConfig/deploySpec/runtimeParams JSON/YAML 校验、namespace DNS-1123、apiEndpoint URL 格式、slug 正则集中定义限长度。验证：非法输入提交被表单阻止（手测或测试）
- [x] 6.7 执行详情轮询优化：区分首次加载与轮询（轮询不触发整页 loading），页面不可见时暂停，`setTimeout(reload,100)` 时序 hack 改 params 联动。验证：RUNNING 状态页面无整页闪烁
- [x] 6.8 批量发布前端优化：发布准备改为按需或批量拉取制品，执行改 `Promise.allSettled` + 部分成功结果汇总展示。验证：多应用发布单个失败不中断其余，结果可见
- [x] 6.9 状态映射收敛到 `src/constants/status.ts`（与后端 D5 口径对齐），替换 4 处散落映射；移除死代码（access.ts、iconMap、未使用导入、`catch(err:any)` 改具体类型）。验证：`pnpm build` 与 `pnpm test` 通过

## 7. 集成验证与收尾

- [x] 7.1 后端全量验证：`go build ./...`、`go test ./app/... ./pkg/...`、`just tidy` 全部通过。验证：CI Go job 本地等价命令零失败
- [x] 7.2 前端全量验证：`pnpm build`、`pnpm test`、`just lint-antd` 通过。验证：CI Frontend job 本地等价命令零失败
- [x] 7.3 端到端冒烟（`just run-titan-rpc` + `just run-gateway` + `just run-titan`）：创建项目→应用→环境→制品→部署（含失败场景）→ 删除保护 → 更新字段不变性 → 分页上限 → 脱敏展示，对照 6 个能力 spec 的关键 Scenario 逐条验证。验证：冒烟脚本或手测记录覆盖全部 P0 场景
- [x] 7.4 `manifest/openapi/openapi.json`/`swagger.json` 重新导出（响应结构变化后同步）。验证：openapi 中 titan 路径响应为标准封装结构
