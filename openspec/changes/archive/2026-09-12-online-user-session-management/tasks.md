## 1. 后端 Redis 会话中枢与网关切面开发

- [x] 1.1 在 `app/gateway/internal/config/config.go` 与 `etc/gateway.yaml` 中配置 Redis 连接
- [x] 1.2 在 `pkg/session` 中实现在线会话管理中枢（`CreateSession`、`ListSessions`、`ForceLogout`、`IsBlacklisted`）
- [x] 1.3 在 `app/gateway/internal/svc/service_context.go` 中初始化 RedisClient 与 SessionManager
- [x] 1.4 在 `admin_login_logic.go` 与 `casdoor_login_logic.go` 成功返回前登记在线会话
- [x] 1.5 在 `app/gateway/internal/middleware/rbac_middleware.go` 中挂载 Token 黑名单吊销判定（401 拦截）
- [x] 1.6 在 `app/gateway/desc/system.api` 声明 `ListOnlineSessions` 与 `ForceLogoutOnlineSession` 路由契约，运行 `just gen-gateway` 并实现 Logic，运行 `just gen-ts` 生成前端 SDK

## 2. 前端 Ant Design Pro 在线用户中心开发

- [x] 2.1 创建 `frontend/apps/admin/src/pages/System/Online/index.tsx` 在线用户 ProTable 页面
- [x] 2.2 在 `frontend/apps/admin/src/config/routes.ts` 注册 `/system/online` 路由
- [x] 2.3 在 `frontend/packages/shared/src/index.ts` 增加 `ONLINE_QUERY` 与 `ONLINE_FORCE` 权限常量
- [x] 2.4 实现自身会话防误操作保护与危险强退二次确认弹窗

## 3. 质量验收与真机验证

- [x] 3.1 编写 `frontend/apps/admin/tests/onlineUsers.test.ts` 单元测试
- [x] 3.2 运行 `just lint-antd` 确保 0 警告，运行 `just test-frontend` 确保测试 100% 通过
- [x] 3.3 重启网关微服务，使用 Chrome DevTools 访问 `/system/online` 进行真机在线监控验证与截图
- [x] 3.4 归档 OpenSpec 规范并正式提交推送
