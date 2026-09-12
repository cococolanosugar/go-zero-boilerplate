# Design: 声明式权限控制系统架构

## 1. 架构流转模型

```text
[ InitialStateContext (currentUser, roles, permissions) ]
                          │
                          ▼
             [ useAccess Hook (src/hooks/useAccess.ts) ]
             ├─ canAccess(accessCode)
             ├─ hasPermission(permission, mode)
             ├─ hasRole(role, mode)
             ├─ isSuperAdmin / canAdmin
             │
             ├──► 命令式逻辑控制: if (hasPermission(...)) { ... }
             │
             └──► 声明式组件: <Access permission="..." fallbackMode="disabled">
                       │
                       ├─ 通行: <>{children}</>
                       ├─ 隐藏: <>{fallback}</>
                       └─ 禁用气泡: <Tooltip><Button disabled ... /></Tooltip>
```

## 2. API 设计与签名

### useAccess()
```ts
export interface UseAccessResult extends AccessResult {
  hasPermission: (perm: string | string[], mode?: "all" | "one") => boolean;
  hasRole: (role: string | string[], mode?: "all" | "one") => boolean;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}
```

### <Access /> Props
```ts
export interface AccessProps {
  accessible?: boolean;
  permission?: string | string[];
  role?: string | string[];
  mode?: "all" | "one";
  fallbackMode?: "hide" | "disabled";
  fallbackTooltip?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```
