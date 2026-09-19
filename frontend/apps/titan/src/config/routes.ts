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

      // 1. 项目与微服务空间
      {
        path: "/space",
        name: "menu.space",
        locale: "menu.space",
        icon: "DeploymentUnitOutlined",
        redirect: "/projects",
        routes: [
          {
            path: "/projects",
            name: "menu.projects",
            locale: "menu.projects",
            icon: "ProjectOutlined",
            component: lazy(() => import("../pages/Projects")),
          },
          {
            path: "/apps",
            name: "menu.apps",
            locale: "menu.apps",
            icon: "AppstoreOutlined",
            component: lazy(() => import("../pages/Apps")),
          },
        ],
      },

      // 2. 持续交付中心
      {
        path: "/delivery",
        name: "menu.delivery",
        locale: "menu.delivery",
        icon: "RocketOutlined",
        redirect: "/environments",
        routes: [
          {
            path: "/environments",
            name: "menu.environments",
            locale: "menu.environments",
            icon: "CloudServerOutlined",
            component: lazy(() => import("../pages/Environments")),
          },
          {
            path: "/artifacts",
            name: "menu.artifacts",
            locale: "menu.artifacts",
            icon: "TagOutlined",
            component: lazy(() => import("../pages/Artifacts")),
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
        ],
      },

      // 3. 基础设施与集成治理
      {
        path: "/infrastructure",
        name: "menu.infrastructure",
        locale: "menu.infrastructure",
        icon: "ClusterOutlined",
        redirect: "/clusters",
        routes: [
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
        ],
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
