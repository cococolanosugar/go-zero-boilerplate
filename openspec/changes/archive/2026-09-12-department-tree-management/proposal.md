# Proposal: 部门树形机构管理 (sys_dept) 与组织架构全栈落地

## 1. 业务背景与问题阐述 (Why)

在企业级中台与微服务应用中，组织机构/部门管理 (`sys_dept`) 是企业人员组织架构与资源治理的基石。
目前 `go-zero-boilerplate` 的架构现状存在以下断层：
1. **持久层已有表结构，但业务链路未打通**：MySQL 基线已定义 `sys_dept` 表并包含初始种子数据（`总公司 / 研发中心`），但微服务 `user.rpc` 与统一网关 `gateway` 尚未封装部门的树形查询与生命周期 CRUD。
2. **缺乏前端管理界面与树形联动**：管理后台尚未建立部门管理页面（`/system/dept`），员工管理（`sys_user`）也无法以树形结构选择归属部门。
3. **数据权限缺乏实体支撑**：角色表内置的 `data_scope`（本部门、本部门及以下、自定义部门）迫切需要完整的部门树与祖级路径（`ancestors`）算法闭环。

因此，作为企业级脚手架优化的第一优先级（P0），必须先行将部门树形机构管理全栈落地。

## 2. 方案与核心价值 (What)

1. **树形数据模型与安全校验 (Model Layer)**:
   - 在 `sys_dept_model.go` 中实现部门树检索、递归祖级列表计算（`ancestors` 如 `0,1,3`）。
   - 实现安全防线：删除部门前严格校验**是否存在子部门**与**是否存在关联员工**，禁止级联误删。
   - 实现层级循环依赖防护：修改部门时，禁止将上级部门变更为自身或自身的子部门。
2. **微服务 RPC 契约与业务 Logic**:
   - 在 `user.proto` 中定义部门树数据结构与标准 CRUD（`CreateSysDept`、`UpdateSysDept`、`DeleteSysDept`、`GetSysDept`、`ListSysDepts`、`GetSysDeptTree`）。
   - 输出树形嵌套结构，适配前端级联组件。
3. **统一网关 BFF 路由暴露**:
   - 在 `app/gateway/desc/user.api` 中注册 `/api/v1/user/dept` 分组路由，注入 JWT 鉴权与 RBAC 权限拦截。
   - 自动生成前端 `@zero/api` SDK 强类型函数。
4. **前端 Ant Design 6.x 树形表格与交互**:
   - 在 `apps/admin/src/pages/System/Dept` 开发符合 Ant Design 6.x 标准的树形 ProTable，支持全部展开/折叠、快捷新增下级部门、状态 Tag 回显。
   - 在新增/编辑 ModalForm 中提供 `TreeSelect` 树形下拉选择上级部门。
   - 在员工管理页面中打通部门树选择与级联筛选。
