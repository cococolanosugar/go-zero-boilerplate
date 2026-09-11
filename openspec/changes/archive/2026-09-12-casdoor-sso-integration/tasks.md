## 1. 基础设施与容器编排

- [x] 1.1 在 `manifest/deploy/docker-compose/docker-compose.yml` 中新增 `casdoor` 服务容器，配置连接现有 MySQL 并验证容器可正常启动
- [x] 1.2 在 `app/gateway/etc/gateway.yaml` 与配置结构体中新增 `Casdoor` 配置节点（Endpoint, ClientId, ClientSecret, Certificate, OrganizationName, ApplicationName）

## 2. 后端依赖与微服务 JIT 拨备

- [x] 2.1 引入 `github.com/casdoor/casdoor-go-sdk` 依赖并执行 `go mod tidy` 验证依赖解析无冲突
- [x] 2.2 在 `app/user/rpc/user.proto` 中定义 `SyncOrCreateCasdoorUser` 请求响应与 RPC 方法，执行 `just gen-rpc user`
- [x] 2.3 在 `app/user/rpc` 中实现 `SyncOrCreateCasdoorUserLogic`：基于 Casdoor 属性完成本地 `sys_user` 查找、新增 JIT 拨备、默认角色赋予与画像更新

## 3. 网关契约与 OIDC 授权置换

- [x] 3.1 在 `app/gateway/desc/user.api` 中追加 `CasdoorLoginReq` 结构体及 `POST /api/v1/system/auth/casdoor/login` 接口定义
- [x] 3.2 执行 `just gen-gateway` 并实现 `CasdoorLoginLogic`：通过 Casdoor SDK 进行 Code 校验换取 UserInfo，随后调用 User RPC 并签发系统 JWT
- [x] 3.3 执行 `just gen-ts` 自动同步前端 `@zero/api` SDK，确认导出包含新的 Casdoor 登录方法

## 4. 前端双端集成与回调路由

- [x] 4.1 在 `@zero/shared` 中实现通用的 Casdoor 授权跳转 URL 构造器（包含 client_id, redirect_uri, state）及安全校验工具
- [x] 4.2 在 `apps/admin` 的 `Login` 页面增设“企业统一 SSO 登录”快捷按钮，并新增 `/callback` 路由处理静默认证重定向
- [x] 4.3 在 `apps/portal` 的 `LoginModal` 中同步增设“企业统一 SSO 登录”入口，并复用 `/callback` 机制完成登录与画像联动
- [x] 4.4 为前端新增的 Casdoor 工具与回调逻辑编写单元测试，验证参数校验与异常处理

## 5. 全链路联调与回归验证

- [x] 5.1 执行 `just lint-antd` 确保前端 Ant Design 代码规范且 0 弃用警告
- [x] 5.2 执行 `just test-frontend` 确保全仓前端自动化测试（Vitest）100% 通过
- [x] 5.3 验证双模认证：SSO 模式与原有账号密码本地登录模式均可正常获取系统 Token 并渲染菜单
