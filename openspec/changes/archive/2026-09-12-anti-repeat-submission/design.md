## Context

当前项目统一网关 (`app/gateway`) 承载了全站流量入口，已具备 Session 会话解析、跨域 CORS、双日志审计（OperLog）与 RBAC 动态权限切面。底层 `svc.ServiceContext` 已原生集成高性能 `RedisClient (*redis.Redis)`。

在电商下单、用户/岗位创建、公告发布等核心写业务中，缺乏集中式的防重复提交与幂等控制，容易因前端连击、网络超时重发或脚本并发导致重复落库。

## Goals / Non-Goals

**Goals:**
- **网关统一防重切面**：对所有进入网关的写操作（`POST`/`PUT`/`DELETE`/`PATCH`）提供基于 Redis `SetnxEx` 的防刷与防重保护。
- **双模防重机制**：
  1. 隐式特征哈希（默认）：`repeat_submit:hash:<user_id|client_ip>:<method>:<path>:<md5(body)>`，窗口期默认 5 秒。
  2. 显式幂等键：支持 `X-Idempotency-Key` 或 `Repeat-Submit-Token`。
- **白名单与非阻塞兼容**：自动放行 `multipart/form-data` 文件流、SSE 实时流和安全读请求（`GET`/`HEAD`/`OPTIONS`）。
- **请求体安全重放**：在中间件中完整复原 `r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))`，确保下游 Handler 与 OperLog 正常消费。
- **前端协同**：在 `@zero/api` 统一请求层建立状态写入去重与防抖，形成端到端双保险闭环。

**Non-Goals:**
- 不取代下游微服务涉及数据库唯一键约束与分布式强一致性事务设计。

## Decisions

1. **Redis 分布式锁选用 `SetnxExCtx` 原子指令**：
   - 相比于先 `Get` 后 `Set`，原子性的 `SET key val EX 5 NX` 完全规避竞态条件，执行时延 < 1ms。
2. **请求载荷哈希算法选用 MD5**：
   - 请求体只需在防重窗口内提供碰撞防护，MD5 具备极高计算性能与充足的离散度。
3. **错误响应标准化**：
   - 拦截重复提交时，统一通过 `result.HttpResult(r, w, nil, xerr.NewErrCode(xerr.RepeatSubmitError))` 输出标准 JSON，HTTP 响应体携带错误码 `100008` 与用户友好提示。
4. **CORS 放行扩展**：
   - 在网关 CORS 中间件的 `Access-Control-Allow-Headers` 中显式放行 `X-Idempotency-Key`、`Repeat-Submit-Token` 与 `X-Repeat-Submit-Interval`。

## Risks / Trade-offs

- **[Risk] 大文件或文件上传请求体读取耗费内存** → **Mitigation**: 遇 `multipart/form-data` 请求直接 bypass，由专用存储驱动校验。
- **[Risk] 请求失败是否需要立即解除锁？** → **Trade-off**: 防重复提交的核心诉求是防止 3~5 秒内的连击或机械重复提交。保留 5s TTL 既能防止恶意快速重试，又具备轻量自愈能力，符合行业成熟实践（如 RuoYi `@RepeatSubmit`）。
