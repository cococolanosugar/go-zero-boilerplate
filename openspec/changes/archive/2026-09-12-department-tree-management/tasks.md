## 1. 持久层 Model 增强与树形安全算法

- [x] 1.1 在 `app/user/model/sys_dept_model.go` 中增加列表查询 `FindAll`、子部门存在校验 `CheckDeptHasChildren`、部门员工存在校验 `CheckDeptHasUsers` 与祖级链路安全更新逻辑

## 2. 微服务 RPC 契约扩展与业务 Logic 闭环

- [x] 2.1 在 `app/user/rpc/user.proto` 中追加部门数据结构与 5 大 CRUD RPC 方法（`ListSysDepts`、`GetSysDept`、`CreateSysDept`、`UpdateSysDept`、`DeleteSysDept`）
- [x] 2.2 运行 `just gen-rpc user` 生成桩代码，并在对应 Logic 中实现树形递归组装、自环依赖校验、祖级更新与安全删除防线

## 3. 网关 BFF 路由暴露与前端 SDK 自动化

- [x] 3.1 在 `app/gateway/desc/user.api` 中定义部门管理路由组，执行 `just gen-gateway` 并编写网关 Logic 桩代码
- [x] 3.2 运行 `just gen-ts` 自动生成前端 `@zero/api` SDK 强类型调用函数，并验证微服务与网关编译通过

## 4. 前端 Ant Design 6.x 树形表格与页面交互

- [x] 4.1 在 `frontend/apps/admin/src/pages/System/Dept/index.tsx` 开发树形 ProTable 页面，包含展开/折叠、状态 Tag、快捷新增下级、`TreeSelect` 上级选择与禁用自环逻辑
- [x] 4.2 在 `frontend/apps/admin/src/config/routes.ts` 注册 `/system/dept` 路由并联动左侧菜单导航

## 5. 质量校验与端到端真机验收

- [x] 5.1 执行 `just lint-antd` 确保 0 警告，执行 `just test-frontend` 确保单元测试 100% 通过
- [x] 5.2 启动微服务与网关，通过 Chrome DevTools 驱动真实浏览器实测部门树展开/折叠、新增子部门、编辑与删除校验流程

