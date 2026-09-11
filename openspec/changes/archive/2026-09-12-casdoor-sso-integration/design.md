## Context

系统当前基于统一网关（HTTP 8888）与内部业务微服务（user.rpc 8080）构建，具备完整的本地账号密码验证与基于角色的访问控制（RBAC）。为了满足企业内部系统接入统一 SSO、飞书/企微/钉钉扫码以及 LDAP 域账号的需求，需在现有架构中无缝叠加 Casdoor 作为统一身份与认证平台。具体业务动机与能力演进见 `proposal.md` 与 `specs/casdoor-sso/spec.md`。

## Goals / Non-Goals

**Goals:**
- **容器编排一键拉起**：在 `manifest/deploy/docker-compose/docker-compose.yml` 中编排 Casdoor 服务，自动复用现有 MySQL 8.0 容器。
- **网关 OIDC 授权码置换**：网关集成 `casdoor-go-sdk`，对外暴露 `POST /api/v1/system/auth/casdoor/login`，安全处理 Code 置换并防范 CSRF。
- **JIT 自动拨备与权限绑定**：在 `user.rpc` 中实现 `SyncOrCreateCasdoorUser`，首次 SSO 登录自动建档并挂载默认部门与基础角色，非首次登录增量同步画像。
- **前端双端平滑集成**：在 `apps/admin` 与 `apps/portal` 登录界面增设 SSO 入口，挂载 `/callback` 路由处理静默认证与路由恢复。
- **双模认证共存 (Dual-Mode Auth)**：保留现有的本地账号密码登录作为容灾通道。

**Non-Goals:**
- **替代本地细粒度业务权限**：不使用 Casdoor 的 Casbin 模型接管系统的 `sys_menu` 动态菜单树、`sys_menu_api` 按钮-接口联动和数据权限 DataScope。Casdoor 专职负责 AuthN（认证），业务微服务闭环负责 AuthZ（授权）。
- **实时全量全域用户反向同步**：首期不实现定时将 Casdoor 全量用户批量写入本地数据库的定时调度任务，采用 JIT 按需增量拨备满足实际需求。

## Decisions

### 1. 认证与授权严格分工 (AuthN vs AuthZ Separation)
- **决定**：Casdoor 仅负责身份认证（你是谁，提取外部 IdP 属性），系统内部 User RPC 负责业务授权（你能做什么，返回角色列表与操作权限）。
- **理由**：避免业务系统与特定 IAM 深度耦合，保持微服务内部数据权限与菜单树的灵活性。
- **备选方案**：完全废弃本地 `sys_user` 并改用 Casdoor 存储所有业务字段 -> 破坏现有微服务领域独立性与本地缓存加速策略。

### 2. 网关代持 Client Secret 的服务端授权码置换 (Authorization Code Flow)
- **决定**：前端仅负责接收重定向返回的 `code` 与 `state`，随后将其 POST 发给网关，由网关在内网使用 Client Secret 向 Casdoor 发起校验并换取 Token。
- **理由**：避免 Client Secret 暴露在浏览器前端，符合企业级安全合规规范；网关可在同一次请求内完成 JIT 拨备并签发系统内部标准的 JWT。
- **备选方案**：前端走 PKCE 流程直接向 Casdoor 换 Token -> 客户端密钥与鉴权生命周期控制复杂，依然需要网关重新签发业务上下文。

### 3. JIT (Just-In-Time) 首次登录自动拨备机制
- **决定**：当用户通过外部 IdP（如飞书/LDAP）首次登录成功后，User RPC 识别到本地无对应 `sys_user`，即以 Casdoor 返回的唯一凭证（`sub` / `username` / `phone`）在本地自动插入一条记录，并自动绑定预设的默认角色（如“普通员工”）。
- **理由**：零运维成本，无需在员工入职时人工在后台重复建账号。
- **备选方案**：若未预先在后台录入账号则拒绝登录 -> 破坏 SSO 免录入核心体验。

## Risks / Trade-offs

- **[Risk] Casdoor 容器异常或网络故障导致全站无法登录**
  → **Mitigation**: 保持本地账号密码登录作为高优先级容灾旁路（Dual-Mode Auth），管理员账号可随时在本地表单登录系统。
- **[Risk] 外部 IdP 用户属性（头像、姓名、手机号）变更导致本地数据滞后**
  → **Mitigation**: 每次 SSO 登录成功时，User RPC 自动对比并更新本地 `real_name`、`avatar`、`email` 等基础展示字段。
