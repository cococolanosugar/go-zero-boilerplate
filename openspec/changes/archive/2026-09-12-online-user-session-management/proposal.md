# Proposal: 在线用户监控与强制下线系统 (Online User Sessions & Force Logout)

## 1. 背景与动机
在企业级中后台（对标 RuoYi Admin、Luna-Pro、若依微服务版）的运维与安全合规体系中，在线会话实时感知与治理是一项高频刚需。

目前系统的痛点：
1. **黑盒会话无感知**：虽然记录了 `sys_login_log` 历史登录，但管理后台无法获知“此时此刻有哪些员工正在使用系统”（账号、登录 IP、操作系统、浏览器、当前登录时间）；
2. **缺乏应急阻断手段**：当发生员工离职注销、异常异地登录或凭据泄露等突发安全事件时，无法针对特定在线用户或 Token 执行即时“强制下线（Force Logout）”吊销操作；
3. **缺少会话治理前端大盘**：缺少直观的 `/system/online` 在线监控 ProTable 界面。

## 2. 方案与交付物
1. **后端 Redis 会话存储与黑名单中枢 (`pkg/session`)**：
   - 登录时（账号密码与 Casdoor SSO）写入会话到 Redis（`sys:online:sess:<id>`、`sys:online:token:<hash>`、`sys:online:zset`），TTL 严格对齐 JWT 过期时间；
   - 强制下线时将该 Token Hash 写入 Redis 黑名单（`sys:blacklist:<hash>`），并从在线集合剔除；
   - 网关 RBAC 切面中间件微秒级比对黑名单，被强退用户立即被中断返回 401。
2. **统一网关 API 契约与 BFF (`app/gateway`)**：
   - 在 `app/gateway/desc/system.api` 声明：
     - `GET /api/v1/system/online` (分页与条件检索在线会话)；
     - `DELETE /api/v1/system/online/:sessionId` (强制下线指定会话)；
   - 运行 `just gen-gateway` 并实现网关 Logic，运行 `just gen-ts` 生成前端 SDK。
3. **前端 Ant Design Pro 在线监控管理中心 (`/system/online`)**：
   - 路由声明与菜单树联动（支持 `system:online:query` 与 `system:online:force` 权限）；
   - 提供 Ant Design ProTable：
     - 员工账号与真实姓名；
     - 登录 IP 与地理位置（内网/公网解析）；
     - 浏览器图标与操作系统标签；
     - 登录时间与剩余有效时间；
     - 操作列：对其他用户显示“强退”危险按钮，自身会话防误操作保护（禁用态+气泡说明）；
   - 被强退客户端收到 401 触发前端全局退出并跳转登录页。
4. **自动化测试与质量保障**：
   - 编写 `frontend/apps/admin/tests/onlineUsers.test.ts`；
   - 运行 `just lint-antd`（0 警告）与 `just test-frontend`（100% 通过）；
   - 使用 Chrome DevTools 真机调试在线用户列表与强退交互并留存截图归档。
