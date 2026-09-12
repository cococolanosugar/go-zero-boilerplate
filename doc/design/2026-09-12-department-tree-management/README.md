# 企业级组织机构部门树形管理 (sys_dept) 设计方案

> **文档版本**：v1.0.0  
> **更新日期**：2026-09-12  
> **文档路径**：`doc/design/2026-09-12-department-tree-management/README.md`  
> **设计目标**：为 `go-zero-boilerplate` 构建工业级组织机构部门管理体系，实现“树形祖级链路 (ancestors) 算法 + 递归死锁环路校验 + 删除防孤岛双重校验 + Ant Design 6.x 现代树形表格与级联选择器”全栈闭环，为后续 5 级数据权限切面提供实体结构支撑。

---

## 1. 业务背景与架构定位

在政企与大中型业务系统中，部门组织架构是企业身份与资源隔离的绝对核心：
1. **树形祖级链路机制 (Ancestors)**：
   每个部门记录其从顶级到自身的完整祖级链路（如 `0,1,2`）。无需复杂的递归连表 SQL，通过单次 `FIND_IN_SET(id, ancestors)` 即可秒级命中该部门下的所有后代子部门。
2. **循环依赖防御 (Cycle Prevention)**：
   编辑部门时，禁止将上级部门选为自身或自身的任意下级子部门，彻底消除成环死锁风险。
3. **安全删除防线 (Safe Deletion)**：
   - 防线一：若部门含有下级子部门，阻断删除。
   - 防线二：若部门下存在归属员工，阻断删除。
4. **前端交互与 Ant Design 6.x 语义化标准**：
   管理后台开发树形 ProTable 页面，支持一键全部展开/折叠，`TreeSelect` 自动置灰自身与子孙节点，实现 0 废弃 API 规范。

---

## 2. 核心架构与数据流转

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 管理员
    participant DeptUI as 部门管理 (/system/dept)
    participant Gateway as 统一网关 (BFF :8888)
    participant UserRPC as 用户微服务 (RPC :8080)
    participant DB as MySQL 8.0 (sys_dept & sys_user)

    %% 流程1：查询部门树
    rect rgb(240, 248, 255)
    Admin->>DeptUI: 访问部门管理或筛选关键词
    DeptUI->>Gateway: GET /api/v1/user/dept?keyword=xxx
    Gateway->>UserRPC: RPC ListSysDepts
    UserRPC->>DB: SELECT * FROM sys_dept ORDER BY parent_id, sort
    DB-->>UserRPC: 扁平行列表
    UserRPC->>UserRPC: 递归构建嵌套 children 树形结构
    UserRPC-->>Gateway-->>DeptUI: 渲染嵌套树形表格与展开折叠
    end

    %% 流程2：创建子部门
    rect rgb(255, 250, 240)
    Admin->>DeptUI: 点击行操作“新增下级”，录入新部门
    DeptUI->>Gateway: POST /api/v1/user/dept
    Gateway->>UserRPC: RPC CreateSysDept (parentId, deptName, ...)
    UserRPC->>DB: 查询 parent.ancestors
    UserRPC->>DB: INSERT INTO sys_dept (ancestors = parent.ancestors + ',' + parent.id)
    UserRPC-->>Gateway-->>DeptUI: 创建成功并刷新部门树
    end

    %% 流程3：删除安全防护
    rect rgb(255, 245, 245)
    Admin->>DeptUI: 尝试删除含有子部门的父级节点
    DeptUI->>Gateway: DELETE /api/v1/user/dept/:id
    Gateway->>UserRPC: RPC DeleteSysDept (id)
    UserRPC->>DB: CheckDeptHasChildren(id) -> 存在子部门!
    UserRPC-->>Gateway: 返回 100007 (Forbidden: 该部门包含下级子部门，禁止删除)
    Gateway-->>DeptUI: 统一拦截并 Toast 报错阻断
    end
```

---

## 3. 核心算法与数据模型

### 3.1 祖级链路 (Ancestors) 计算与级联更新
- 根部门：`parent_id = 0`，`ancestors = "0"`。
- 子部门：`ancestors = parent.ancestors + "," + parent.id`。
- 修改上级部门时级联更新后代：
  ```go
  func (m *customSysDeptModel) UpdateDeptWithChildren(ctx context.Context, dept *SysDept, oldAncestors string, newAncestors string) error {
      return m.TransactCtx(ctx, func(ctx context.Context, session sqlx.Session) error {
          if err := m.Update(ctx, dept); err != nil {
              return err
          }
          if oldAncestors != newAncestors {
              children, err := m.FindChildren(ctx, dept.Id)
              for _, child := range children {
                  child.Ancestors = strings.Replace(child.Ancestors, oldAncestors, newAncestors, 1)
                  m.Update(ctx, child)
              }
          }
          return nil
      })
  }
  ```

---

## 4. 验证与实操指标

![部门树形管理实测](/frontend/apps/admin/public/sys_dept_verified.png)

1. **Ant Design 6.x 静态规范**：执行 `just lint-antd`，扫描 74 个 admin 源码文件与 50 个 portal 源码文件，**0 警告 0 废弃项**。
2. **前端自动化测试套件**：Vitest **20 个测试套件，80/80 个单元测试 100% 通过**。
3. **真实浏览器端到端链路验收**：
   - 根部门“总公司 / 研发中心”下创建“基础架构部”；
   - “基础架构部”下创建“微服务治理组”；
   - 树形表格多级缩进、折叠展开与节点状态正常；
   - 尝试删除“总公司 / 研发中心”，系统正确拦截并提示“该部门包含下级子部门，禁止删除”。
