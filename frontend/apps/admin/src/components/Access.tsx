import React from "react";
import { Tooltip } from "antd";
import { useAccess } from "../hooks/useAccess";

export interface AccessProps {
  /** 显式布尔权限值，优先级最高 */
  accessible?: boolean;
  /** 单个权限标识或权限标识列表，如 'system:user:add' */
  permission?: string | string[];
  /** 单个角色标识或角色标识列表，如 'ROLE_ADMIN' */
  role?: string | string[];
  /** 多权限或多角色匹配模式：one (满足其一即可，默认) | all (必须全部满足) */
  mode?: "all" | "one";
  /** 权限未通过时的渲染策略：hide (直接隐藏不渲染，默认) | disabled (渲染禁用态并包裹气泡提示) */
  fallbackMode?: "hide" | "disabled";
  /** 禁用气泡提示文案，默认 "暂无操作权限" */
  fallbackTooltip?: string;
  /** 权限未通过时的自定义降级渲染节点（仅在 fallbackMode="hide" 时生效） */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 细粒度声明式权限控制组件（对标 Ant Design Pro Access 规范）
 * 支持依据权限码、角色标识或动态布尔值控制子组件渲染与优雅降级
 */
export const Access: React.FC<AccessProps> = ({
  accessible,
  permission,
  role,
  mode = "one",
  fallbackMode = "hide",
  fallbackTooltip = "暂无操作权限",
  fallback = null,
  children,
}) => {
  const { hasPermission, hasRole } = useAccess();

  let isAllowed = true;

  if (typeof accessible === "boolean") {
    isAllowed = accessible;
  } else {
    if (permission) {
      isAllowed = isAllowed && hasPermission(permission, mode);
    }
    if (role) {
      isAllowed = isAllowed && hasRole(role, mode);
    }
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallbackMode === "disabled" && React.isValidElement(children)) {
    // 禁用态并包裹气泡提示
    const disabledChild = React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      onClick: undefined,
      style: {
        ...(children as React.ReactElement<any>).props.style,
        pointerEvents: "none",
      },
    });

    return (
      <Tooltip title={fallbackTooltip}>
        <span style={{ display: "inline-block", cursor: "not-allowed" }}>
          {disabledChild}
        </span>
      </Tooltip>
    );
  }

  return <>{fallback}</>;
};

export { useAccess };
export default Access;
