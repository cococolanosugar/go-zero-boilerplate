# Proposal: 个人中心与头像设置与密码安全 (account-settings-and-profile)

## 1. 业务背景与问题阐述 (Why)

在企业级中后台系统中，员工个人中心 (`/account/settings`) 是员工日常维护自身画像（真实姓名、联系电话、电子邮箱、头像）与安全凭证（登录密码修改）的最高频入口。
当前系统的现状如下：
1. **缺少个人中心页面**：员工登录系统后，右上角头像下拉菜单中的“个人设置”或“个人中心”处于缺省或不可点击状态，员工无法自主修改个人信息。
2. **头像上传未形成闭环**：通用对象存储驱动（`pkg/storage`）与上传接口已打通，但员工头像只能依赖外部 URL，缺乏在前端直接本地选择图片、流式上传至网关并同步绑定至用户画像的完整链路。
3. **密码修改能力缺失**：员工无法在后台自主更换弱口令，存在安全审计隐患。

## 2. 方案与核心价值 (What)

1. **后端个人中心接口闭环**:
   - 在 `app/user/rpc/user.proto` 增加 `UpdatePersonalProfile` 与 `ChangePersonalPassword` RPC。
   - 在 `app/gateway/desc/system.api` 暴露 `PUT /api/v1/system/personal/profile` 与 `PUT /api/v1/system/personal/password`。
   - 严格基于 JWT Claims 解析当前登录人 `userId`，杜绝越权风险。
2. **前端 Ant Design Pro 个人设置页面 (`/account/settings`)**:
   - 采用分栏/Tab 标签页设计（基本设置、安全设置）。
   - 集成头像上传：选择图片即调用 `@zero/api` 的 `uploadSingleFile`，实时预览并同步更新右上角全局头像。
   - 提供修改密码表单与强度防呆校验。
3. **全局右上角用户菜单联动**:
   - 在 `BasicLayout.tsx` 用户下拉菜单中激活“个人设置”跳转，路由自动选中与多标签页联动。
