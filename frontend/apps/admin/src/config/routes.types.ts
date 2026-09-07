import React from "react";

/**
 * 声明式路由项配置规范（对齐 Ant Design Pro 规范）
 */
export interface AppRouteItem {
  /** 路由路径（以 / 开头为绝对路径，或子路由相对路径） */
  path: string;
  /** 菜单展示名称 */
  name?: string;
  /** 国际化多语言 Key (如 'menu.dashboard') */
  locale?: string;
  /** 菜单图标（ReactNode 或 Antd Icon 名称字符串） */
  icon?: React.ReactNode | string;
  /** 对应的页面组件（支持 React.lazy 动态导入组件） */
  component?: React.ComponentType<any> | React.LazyExoticComponent<any>;
  /** 重定向路径 */
  redirect?: string;
  /** 是否包裹在主布局中，默认为 true；若设为 false 则脱离 BasicLayout 独立渲染（如 /login） */
  layout?: boolean;
  /** 是否为公开路由，若为 true 则绕过登录守卫 AuthGuard */
  public?: boolean;
  /** 权限码标识（结合 access.ts 鉴权，如 PERMISSIONS.USER_QUERY） */
  access?: string;
  /** 是否在菜单栏隐藏该项 */
  hideInMenu?: boolean;
  /** 嵌套子路由 */
  routes?: AppRouteItem[];
}
