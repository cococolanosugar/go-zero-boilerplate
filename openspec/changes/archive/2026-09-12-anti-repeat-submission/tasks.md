## 1. 错误体系扩展与网关防重切面中间件开发

- [x] 1.1 在 `pkg/xerr/errCode.go` 增加 `RepeatSubmitError = 100008` 与友好提示文案，并通过 Go 单元测试验证
- [x] 1.2 在 `app/gateway/internal/middleware/anti_repeat_middleware.go` 实现 `AntiRepeatMiddleware`，支持特征哈希、显式幂等键与请求体重放
- [x] 1.3 在 `app/gateway/gateway.go` 全局挂载 `AntiRepeatMiddleware` 并在 CORS 头中放行幂等请求头

## 2. 前端请求层防重与并发去重机制

- [x] 2.1 在 `frontend/packages/api/src/request.ts` 增强写请求并发锁与防抖拦截，防止短时间连续点击触发多次网络请求
- [x] 2.2 验证各端编译并运行 `just lint-antd` 确保 0 警告

## 3. 端到端单元测试与质量验证

- [x] 3.1 编写 `app/gateway/internal/middleware/anti_repeat_middleware_test.go`，测试特征哈希碰撞拦截、TTL 自然过期与白名单放行
- [x] 3.2 编写前端测试验证并发请求去重与防重行为，运行 `just test-frontend` 确保 100% 通过
- [x] 3.3 重新编译网关并在本地运行验证真实写接口连续调用的防重效果
- [x] 3.4 归档 OpenSpec 规范并提交代码
