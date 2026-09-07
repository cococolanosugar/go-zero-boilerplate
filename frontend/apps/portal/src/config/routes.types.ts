import React from "react";

/**
 * 门户声明式路由项配置规范（对齐 Ant Design Pro 规范）
 */
export interface AppRouteItem {
  /** 路由路径 */
  path: string;
  /** 导航菜单展示名称 */
  name?: string;
  /** 国际化多语言 Key (如 'menu.home') */
  locale?: string;
  /** 导航图标 */
  icon?: React.ReactNode | string;
  /** 页面组件（支持 React.lazy 动态导入组件） */
  component?: React.ComponentType<any> | React.LazyExoticComponent<any>;
  /** 重定向路径 */
  redirect?: string;
  /** 是否包裹在主布局中，默认为 true */
  layout?: boolean;
  /** 是否为公开路由 */
  public?: boolean;
  /** 权限码或角色标识 */
  access?: string;
  /** 是否在导航栏中隐藏 */
  hideInMenu?: boolean;
  /** 嵌套子路由 */
  routes?: AppRouteItem[];
}
