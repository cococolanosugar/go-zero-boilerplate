import React from "react";
import { Tooltip } from "antd";
import { useAuth } from "../contexts/AuthContext";

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
  const { hasPermission, hasRole } = useAuth();

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

export default Access;
