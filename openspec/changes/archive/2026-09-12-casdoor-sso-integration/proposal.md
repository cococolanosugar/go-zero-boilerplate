## Why

当前系统的身份认证完全依赖独立的本地账号密码库（`sys_user`），在企业内部应用场景中无法满足与企业现有身份设施（如 LDAP / Active Directory、飞书、企业微信、钉钉等协同办公平台）的统一认证与免登诉求。同时，当内部微服务与前端应用（Admin、Portal）逐步扩展时，缺乏中心化单点登录（SSO）与多因子安全防护（MFA）。

引入开源、Go 语言构建且天然适配 Ant Design 体系的 Casdoor 作为统一 IAM / SSO 基础设施，以极低的架构侵入成本为企业大仓赋予开箱即用的多端单点登录、外部账号源代理（Broker）与 JIT 自动账号拨备能力。

## What Changes

- **基础设施容器化编排**：在 `manifest/deploy/docker-compose/docker-compose.yml` 中新增 `casdoor` 服务容器，复用现有 MySQL 作为元数据持久层，开箱提供 OIDC/OAuth2 认证服务。
- **网关认证与 OIDC 授权端点**：
  - 网关 `app/gateway` 引入 `casdoor-go-sdk`。
  - 在 `gateway.api` 声明 `POST /api/v1/system/auth/casdoor/login` 接口契约，支持接收 Casdoor 重定向附带的授权码（`code` 与 `state`）。
  - 实现登录逻辑：网关向 Casdoor 置换 AccessToken 并提取标准化 UserInfo（`sub`, `username`, `email`, `phone`, `displayName`）。
- **用户自动拨备与权限映射 (JIT Provisioning)**：
  - 用户微服务 `app/user/rpc` 增加 Casdoor 用户查找与自动建档 RPC 方法 `SyncOrCreateCasdoorUser`。
  - 若用户在本地不存在，基于 Casdoor 画像自动完成 JIT 初始化（赋予默认部门与基础角色），返回本地 User ID 及 RBAC 角色与按钮权限。
- **前端单点登录与静默回调支持**：
  - 在 `apps/admin` 与 `apps/portal` 登录界面增设“企业统一 SSO 登录”入口。
  - 新增 `/callback` 路由处理 Casdoor 登录成功后的 Code 提取，静默调用网关置换系统 JWT 并完成路由定向。
  - 保持现有本地账号密码登录作为容灾备用（Dual-Mode Auth）。

## Capabilities

### New Capabilities
- `casdoor-sso`: 覆盖 Casdoor 容器编排部署、网关 OIDC 授权码交换验证、User RPC 的 JIT 用户增量同步与权限映射，以及前端 Admin/Portal 双端的 SSO 跳转与回调接入。

### Modified Capabilities
<!-- No requirement changes to existing specs; purely additive capability -->

## Impact

- **后端依赖**：网关引入 `github.com/casdoor/casdoor-go-sdk`。
- **API 契约**：在 `gateway.api` 增加 Casdoor 登录请求与响应类型，自动同步 TypeScript SDK。
- **数据库**：MySQL 新增 `casdoor` 库（由 Casdoor 自动创建），现有 `go_zero_boilerplate` 库无破坏性 schema 变更。
- **前端路由**：两端前端各增添 1 个 `/callback` 公开回调路由。
