import { lazy } from "react";
import type { AppRouteItem } from "./routes.types";

/**
 * 门户声明式编译时路由配置（对齐 Ant Design Pro 规范）
 * 所有页面通过 React.lazy() 实现按需懒加载代码分割
 */
export const routes: AppRouteItem[] = [
  {
    path: "/",
    layout: true,
    routes: [
      {
        path: "/",
        redirect: "/home",
      },
      {
        path: "/home",
        name: "menu.home",
        locale: "menu.home",
        icon: "HomeOutlined",
        component: lazy(() => import("../pages/Home")),
      },
      {
        path: "/services",
        name: "menu.services",
        locale: "menu.services",
        icon: "ClusterOutlined",
        component: lazy(() => import("../pages/Services")),
      },
      {
        path: "/workbench",
        name: "menu.workbench",
        locale: "menu.workbench",
        icon: "ApiOutlined",
        component: lazy(() => import("../pages/Workbench")),
      },
      {
        path: "/403",
        name: "403",
        hideInMenu: true,
        component: lazy(() => import("../pages/Exception/403")),
      },
      {
        path: "/404",
        name: "404",
        hideInMenu: true,
        component: lazy(() => import("../pages/Exception/404")),
      },
      {
        path: "/500",
        name: "500",
        hideInMenu: true,
        component: lazy(() => import("../pages/Exception/500")),
      },
    ],
  },
  {
    path: "*",
    component: lazy(() => import("../pages/Exception/404")),
    layout: false,
  },
];

export default routes;
