## 1. 后端 RPC 契约扩展与 Logic 实现

- [x] 1.1 在 `app/user/rpc/user.proto` 中增加 `UpdatePersonalProfile` 与 `ChangePersonalPassword` 方法并执行 `just gen-rpc user`
- [x] 1.2 在 `app/user/rpc/internal/logic` 中实现个人信息更新与密码比对/加密更新逻辑
- [x] 1.3 在 `app/gateway/desc/system.api` 声明 `PUT /api/v1/system/personal/profile` 与 `PUT /api/v1/system/personal/password` 路由
- [x] 1.4 运行 `just gen-gateway` 并实现网关 Logic 绑定当前 JWT `userId`，运行 `just gen-ts` 生成前端 SDK

## 2. 前端 Ant Design Pro 个人设置页面开发

- [x] 2.1 创建 `frontend/apps/admin/src/pages/Account/Settings/index.tsx` 页面（基本设置 Tab + 安全设置 Tab）
- [x] 2.2 整合 `uploadSingleFile` 实现头像本地图片即时上传、裁剪预览与保存
- [x] 2.3 在 `frontend/apps/admin/src/config/routes.ts` 注册 `/account/settings` 路由并联动右上角用户下拉菜单
- [x] 2.4 编写单元测试 `frontend/apps/admin/tests/accountSettings.test.ts` 验证表单与交互

## 3. 质量验收与真机验证

- [x] 3.1 运行 `just lint-antd` 确保 0 警告，运行 `just test-frontend` 确保单元测试 100% 通过
- [x] 3.2 启动微服务与网关，通过 Chrome DevTools 真机验收个人信息修改、头像上传回显与密码修改流程
- [x] 3.3 归档 OpenSpec 规范并正式提交推送
