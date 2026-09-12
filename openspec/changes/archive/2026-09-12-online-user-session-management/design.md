# Design: 在线用户监控与强制下线系统设计

## 1. 架构流转模型

```text
[ 用户登录 Login (AdminLogin / CasdoorLogin) ]
             │
             ├─ 1. 签发 JWT (accessToken, 24h)
             ├─ 2. 计算 tokenHash = SHA256(token)
             └─ 3. 写入 Redis:
                    - SETEX sys:online:sess:<sessionId> 86400 {sessionId, tokenHash, userId, username, ip, ua...}
                    - SETEX sys:online:token:<tokenHash> 86400 <sessionId>
                    - ZADD sys:online:zset <expireTimestamp> <sessionId>

[ 客户端发送 HTTP 请求 (携带 Bearer Token) ]
             │
             ▼
[ Gateway: RbacMiddleware 切面拦截 ]
             │
             ├─ 计算 reqTokenHash = SHA256(token)
             ├─ 检查 Redis EXISTS sys:blacklist:<reqTokenHash>
             │    ├── 命中黑名单 ──► 直接返回 HTTP 401 (xerr.TokenExpireError / "会话已被管理员强退")
             │    └── 未在黑名单 ──► 继续执行 RBAC 与下游业务 Logic

[ 管理员强退会话 (DELETE /api/v1/system/online/:sessionId) ]
             │
             ▼
[ Gateway: ForceLogoutLogic ]
             │
             ├─ 获取 session = GET sys:online:sess:<sessionId>
             ├─ SETEX sys:blacklist:<tokenHash> <remainTtl> "1"
             ├─ DEL sys:online:sess:<sessionId> & sys:online:token:<tokenHash>
             └─ ZREM sys:online:zset <sessionId>
```

## 2. API 接口定义与字段

### `GET /api/v1/system/online`
- 请求参数：
  - `page`: int (默认 1)
  - `pageSize`: int (默认 10)
  - `username`: string (可选搜索)
  - `loginIp`: string (可选搜索)
- 响应结构：
  - `total`: int64
  - `list`: Array of OnlineSessionItem:
    - `sessionId`: string
    - `userId`: int64
    - `username`: string
    - `realName`: string
    - `deptName`: string
    - `loginIp`: string
    - `loginLocation`: string
    - `browser`: string
    - `os`: string
    - `loginTime`: string
    - `isCurrent`: bool (是否为当前登录者的会话)

### `DELETE /api/v1/system/online/:sessionId`
- 路径参数：`sessionId`
- 响应：`{ "success": true }`
