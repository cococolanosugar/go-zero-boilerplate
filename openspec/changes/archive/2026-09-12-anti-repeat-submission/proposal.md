## Why

在企业级管理系统与微服务场景中，由于客户端网络抖动、用户连续快速点击按钮（Double Click）、浏览器自动重试或恶意刷接口，经常导致同一写操作（`POST`/`PUT`/`DELETE`/`PATCH`）在极短时间内多次抵达后端。若无防重复提交切面防护，极易造成数据库脏数据插入、重复扣款或资源状态错乱。

借鉴 RuoYi `@RepeatSubmit` 以及 Ant Design Pro / LunaPro 生产级幂等体系，本项目需要在统一网关层与前端请求层构建全栈双向防重复提交与幂等防护机制：
1. **网关切面拦截器**：基于 Redis 分布式缓存，支持请求特征哈希（Method + Path + Body Hash + User/IP）以及显式幂等键（`X-Idempotency-Key` / `Repeat-Submit-Token`），提供秒级（默认 5s）防重复提交校验，返回统一业务错误码（`xerr.RepeatSubmitError` / HTTP 429）。
2. **前端请求层与组件防护**：在 `@zero/api` / Axios 请求拦截器中自动为写操作维护防重哈希与 In-Flight 锁，结合 Ant Design ProForm 表单按钮提交防抖，实现端到端的全栈幂等闭环。

## What Changes

- **网关防重切面中间件**：在 `app/gateway/internal/middleware/anti_repeat_middleware.go` 实现 `AntiRepeatMiddleware`，基于 Redis `SetnxEx` 拦截高频重复写请求。
- **业务错误码扩展**：在 `pkg/xerr/errCode.go` 新增 `RepeatSubmitError = 100008` 及友好提示信息。
- **网关全局挂载与 CORS 放行**：在 `app/gateway/gateway.go` 挂载 `AntiRepeatMiddleware`，并在 CORS 头中放行 `X-Idempotency-Key` 与 `Repeat-Submit-Token`。
- **前端请求切面防重支持**：在 `frontend/packages/api/src/request.ts` 引入请求签名与并发去重机制，防止客户端瞬间连击发出重复请求。
- **自动化测试套件**：编写后端中间件单元测试与前端防重测试，覆盖并发抑制、TTL 超时释放、以及白名单放行机制。

## Capabilities

### New Capabilities
- `anti-repeat-submission`: 企业级业务数据防重复提交与幂等防护规范，定义网关切面哈希与 Token 锁机制，以及前端请求拦截规范。

### Modified Capabilities
<!-- None -->

## Impact

- **后端**：`app/gateway/gateway.go`, `app/gateway/internal/middleware/anti_repeat_middleware.go`, `pkg/xerr/errCode.go`, `app/gateway/etc/gateway.yaml`。
- **前端**：`frontend/packages/api/src/request.ts`。
- **影响评估**：不改变现有接口契约，向后兼容，所有业务 RPC 无需改动。
