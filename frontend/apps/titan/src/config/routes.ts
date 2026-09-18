import { lazy } from "react";
import type { AppRouteItem } from "./routes.types";

export const routes: AppRouteItem[] = [
  {
    path: "/",
    layout: true,
    routes: [
      {
        path: "/",
        redirect: "/dashboard",
      },
      {
        path: "/dashboard",
        name: "menu.dashboard",
        locale: "menu.dashboard",
        icon: "DashboardOutlined",
        component: lazy(() => import("../pages/Dashboard")),
      },
      {
        path: "/pipelines",
        name: "menu.pipelines",
        locale: "menu.pipelines",
        icon: "BranchesOutlined",
        component: lazy(() => import("../pages/Pipelines")),
      },
      {
        path: "/pipelines/exec/:id",
        name: "menu.pipeline.detail",
        locale: "menu.pipeline.detail",
        hideInMenu: true,
        component: lazy(() => import("../pages/Pipelines/ExecutionDetail")),
      },
      {
        path: "/clusters",
        name: "menu.clusters",
        locale: "menu.clusters",
        icon: "ClusterOutlined",
        component: lazy(() => import("../pages/Clusters")),
      },
      {
        path: "/integrations",
        name: "menu.integrations",
        locale: "menu.integrations",
        icon: "ApiOutlined",
        component: lazy(() => import("../pages/Integrations")),
      },

      // 兼容历史 /titan/* 路由重定向
      {
        path: "/titan",
        redirect: "/pipelines",
        hideInMenu: true,
      },
      {
        path: "/titan/pipelines",
        redirect: "/pipelines",
        hideInMenu: true,
      },
      {
        path: "/titan/clusters",
        redirect: "/clusters",
        hideInMenu: true,
      },
      {
        path: "/titan/integrations",
        redirect: "/integrations",
        hideInMenu: true,
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
    path: "/login",
    name: "login",
    layout: false,
    hideInMenu: true,
    component: lazy(() => import("../pages/Login")),
  },
  {
    path: "/callback",
    name: "callback",
    layout: false,
    hideInMenu: true,
    component: lazy(() => import("../pages/Callback")),
  },
  {
    path: "*",
    component: lazy(() => import("../pages/Exception/404")),
    layout: false,
  },
];

export default routes;
