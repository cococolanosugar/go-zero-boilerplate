# Design: 个人中心与资料设置 (account-settings-and-profile) 架构设计

## 1. 业务流程时序图

```text
[浏览器: /account/settings]
      |
      | 1. 选择本地头像图片
      |--------------------------------------------------------> [网关: POST /api/v1/system/file/upload]
      |                                                                 |
      | 2. 返回 { url: "/uploads/2026/09/12/xxx.png" }                 | 写入 pkg/storage
      |<----------------------------------------------------------------+
      |
      | 3. 提交基本资料 PUT /api/v1/system/personal/profile
      |--------------------------------------------------------> [网关 BFF: updatePersonalProfile]
      |                                                                 |
      |                                                                 | 4. UserRpc.UpdatePersonalProfile
      |                                                                 +-----------------------------> [user.rpc]
      |                                                                                                     | 更新 sys_user
      | 5. 返回更新成功并刷新全局用户信息                                                                    |
      |<----------------------------------------------------------------------------------------------------+
```

---

## 2. API 契约设计

### 2.1 网关 RESTful 接口 (`app/gateway/desc/system.api`)
```api
type (
    UpdatePersonalProfileReq {
        RealName string `json:"realName"`
        Mobile   string `json:"mobile,optional"`
        Email    string `json:"email,optional"`
        Avatar   string `json:"avatar,optional"`
    }

    ChangePersonalPasswordReq {
        OldPassword string `json:"oldPassword"`
        NewPassword string `json:"newPassword"`
    }
)

@server (
    prefix: /api/v1/system
    group:  system
    jwt:    Auth
)
service gateway {
    @doc "修改个人资料"
    @handler UpdatePersonalProfile
    put /personal/profile (UpdatePersonalProfileReq) returns (SysEmptyResp)

    @doc "修改个人登录密码"
    @handler ChangePersonalPassword
    put /personal/password (ChangePersonalPasswordReq) returns (SysEmptyResp)
}
```

### 2.2 微服务 RPC 接口 (`app/user/rpc/user.proto`)
```protobuf
message UpdatePersonalProfileRequest {
    int64 userId = 1;
    string realName = 2;
    string mobile = 3;
    string email = 4;
    string avatar = 5;
}

message ChangePersonalPasswordRequest {
    int64 userId = 1;
    string oldPassword = 2;
    string newPassword = 3;
}
```

---

## 3. 前端 UI 与路由架构

- 页面地址：`/account/settings`
- 结构组织：
  - `BasicSettings`：姓名、手机、邮箱、头像展示与 `<Upload>` 选择器
  - `SecuritySettings`：原密码、新密码、确认新密码
- 右上角用户头像下拉菜单绑定：点击进入 `/account/settings`
