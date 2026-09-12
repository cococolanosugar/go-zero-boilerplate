# Design: 部门树形机构管理 (sys_dept) 全栈架构设计

## 1. 架构目标与职责划分

本方案遵循 Monorepo 工业级微服务分层规范：
- **持久层 (`app/user/model`)**：承载部门表 `sys_dept` 的增删改查、树形祖级链路（`ancestors`）算法、删除防线校验（子部门校验、归属员工校验）与事务更新。
- **微服务层 (`app/user/rpc`)**：闭环组织机构业务规则，提供扁平列表查询与树形嵌套（`DeptTreeItem`）递归组装。
- **网关 BFF 层 (`app/gateway`)**：提供 `/api/v1/user/dept` 规范 RESTful API，挂载 JWT 鉴权与 RBAC 切面。
- **前端 SDK 与应用层 (`@zero/api` & `apps/admin`)**：自动同步强类型 SDK，在管理后台开发 `/system/dept` 树形交互页面，支持全部折叠/展开、上级部门级联 `TreeSelect` 选择与员工联动。

---

## 2. 树形祖级链路与核心算法设计

### 2.1 祖级链路 (Ancestors) 机制
借鉴 LinaPro 与 RuoYi 经典的祖级链路设计：
- 根部门（`id = 1`）：`parent_id = 0`，`ancestors = "0"`。
- 一级子部门（如技术部 `id = 2`）：`parent_id = 1`，`ancestors = "0,1"`。
- 二级子部门（如前端组 `id = 3`）：`parent_id = 2`，`ancestors = "0,1,2"`。

### 2.2 循环依赖与自闭环检测 (Cycle Prevention)
当管理员修改部门 $A$ 的上级部门为 $P$ 时：
1. **直接自环检测**：若 $P == A$，直接报错：`上级部门不能是自身`。
2. **后代成环检测**：查询 $P$ 的 `ancestors` 列表，若包含 $A$（例如匹配 `^A,` 或 `,A,` 或 `,A$`），说明 $P$ 是 $A$ 的子孙节点。此时将上级设为 $P$ 将造成死锁环路，直接阻断并返回错误提示。

### 2.3 变更上级部门后的子孙链路级联刷新
当部门 $A$ 的上级合法变更为 $P$ 时：
- 计算新祖级：`newAncestors = P.ancestors + "," + P.id`
- 原祖级：`oldAncestors = A.ancestors`
- 事务执行：
  ```sql
  -- 1. 更新当前部门
  UPDATE sys_dept SET parent_id = ?, ancestors = ? WHERE id = ?;
  -- 2. 级联更新所有子孙部门
  UPDATE sys_dept SET ancestors = REPLACE(ancestors, ?, ?) 
  WHERE FIND_IN_SET(?, ancestors);
  ```

### 2.4 删除保护两道防线 (Safe Deletion)
在执行 `DeleteSysDept(id)` 前，通过 Model 层检查两项前置条件：
```go
// 防线一：是否存在子部门
hasChildren, err := m.CheckDeptHasChildren(ctx, id)
if hasChildren {
    return xerr.NewCodeError(xerr.Forbidden, "该部门包含下级子部门，禁止删除")
}

// 防线二：是否存在关联员工
hasUsers, err := m.CheckDeptHasUsers(ctx, id)
if hasUsers {
    return xerr.NewCodeError(xerr.Forbidden, "该部门下仍有归属员工，禁止删除")
}
```

---

## 3. 接口契约设计 (Protobuf & API)

### 3.1 微服务 Protobuf 契约 (`user.proto`)
```protobuf
message SysDeptItem {
  int64 id = 1;
  int64 parentId = 2;
  string ancestors = 3;
  string deptName = 4;
  int64 sort = 5;
  string leader = 6;
  string phone = 7;
  int64 status = 8;
  string createTime = 9;
  string updateTime = 10;
  repeated SysDeptItem children = 11; // 树形递归嵌套
}

message ListSysDeptsRequest {
  string keyword = 1;
  int64 status = 2; // -1 或 0/1
}

message ListSysDeptsResponse {
  repeated SysDeptItem list = 1;
}

message CreateSysDeptRequest {
  int64 parentId = 1;
  string deptName = 2;
  int64 sort = 3;
  string leader = 4;
  string phone = 5;
  int64 status = 6;
}

message UpdateSysDeptRequest {
  int64 id = 1;
  int64 parentId = 2;
  string deptName = 3;
  int64 sort = 4;
  string leader = 5;
  string phone = 6;
  int64 status = 7;
}

message DeleteSysDeptRequest {
  int64 id = 1;
}
```

### 3.2 统一网关 RESTful 路由 (`desc/user.api`)
```api
@server (
  prefix: /api/v1/user/dept
  group: sys_dept
  jwt: Auth
)
service gateway {
  @doc "获取部门列表/树形列表"
  @handler ListSysDept
  get /list (ListSysDeptReq) returns (ListSysDeptResp)

  @doc "获取部门详情"
  @handler GetSysDept
  get /:id (SysIdReq) returns (SysDeptItem)

  @doc "创建新部门"
  @handler CreateSysDept
  post / (CreateSysDeptReq) returns (SysIdResp)

  @doc "更新部门"
  @handler UpdateSysDept
  put / (UpdateSysDeptReq) returns (SysEmptyResp)

  @doc "删除部门"
  @handler DeleteSysDept
  delete /:id (SysIdReq) returns (SysEmptyResp)
}
```

---

## 4. 前端树形表格与交互实现 (Ant Design 6.x)

1. **表格层级与折叠**:
   - `ProTable` 数据源为嵌套的树形数组（`item.children`）。
   - 提供“全部展开 / 全部折叠”快捷按钮，通过 `expandedRowKeys` 状态控制。
2. **上级部门选择 (`TreeSelect`)**:
   - 在新增/编辑部门的 ModalForm 中，上级部门使用 `TreeSelect` 渲染：
   - 根节点显示为 `顶级部门 (ID: 0)`。
   - 编辑当前部门时，自动将当前部门及其所有子孙节点在 TreeSelect 中置灰（`disabled: true`），在前端界面层阻止选择自身及下级。
3. **行级快捷操作**:
   - 每行提供操作按钮：`新增下级`、`编辑`、`删除`（带 Popconfirm 提示）。
   - 点击“新增下级”时，ModalForm 自动将 `parentId` 预填为当前行 ID。
