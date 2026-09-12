import { lazy } from "react";
import { PERMISSIONS } from "@zero/shared";
import type { AppRouteItem } from "./routes.types";

/**
 * 编译时静态路由表（唯一事实源 Single Source of Truth）
 * 所有页面均采用 React.lazy() 按需分包引入
 */
export const routes: AppRouteItem[] = [
  // 1. 公开免登录路由
  {
    path: "/login",
    component: lazy(() => import("../pages/Login")),
    layout: false,
    public: true,
  },
  {
    path: "/callback",
    component: lazy(() => import("../pages/Callback")),
    layout: false,
    public: true,
  },

  // 2. 主后台业务路由体系（受 AuthGuard 保护，嵌套在 BasicLayout 中）
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
        path: "/workplace",
        name: "menu.workplace",
        locale: "menu.workplace",
        icon: "AppstoreOutlined",
        component: lazy(() => import("../pages/Workplace")),
      },
      {
        path: "/form/step-form",
        name: "menu.form.stepform",
        locale: "menu.form.stepform",
        icon: "FormOutlined",
        component: lazy(() => import("../pages/Form/StepForm")),
      },
      {
        path: "/profile/advanced",
        name: "menu.profile.advanced",
        locale: "menu.profile.advanced",
        icon: "ProfileOutlined",
        component: lazy(() => import("../pages/Profile/Advanced")),
      },
      {
        path: "/result/success",
        name: "menu.result.success",
        locale: "menu.result.success",
        icon: "CheckCircleOutlined",
        hideInMenu: true,
        component: lazy(() => import("../pages/Result/Success")),
      },
      {
        path: "/orders",
        name: "menu.orders",
        locale: "menu.orders",
        icon: "ShoppingCartOutlined",
        component: lazy(() => import("../pages/Orders")),
      },
      {
        path: "/users",
        name: "menu.users",
        locale: "menu.users",
        icon: "UserOutlined",
        component: lazy(() => import("../pages/Users")),
      },

      // 企业级系统与权限治理模块
      {
        path: "/system",
        name: "menu.system",
        locale: "menu.system",
        icon: "SettingOutlined",
        access: "system:manage",
        routes: [
          {
            path: "/system",
            redirect: "/system/users",
          },
          {
            path: "/system/dept",
            name: "menu.system.dept",
            locale: "menu.system.dept",
            icon: "ApartmentOutlined",
            component: lazy(() => import("../pages/System/Dept")),
          },
          {
            path: "/system/users",
            name: "menu.system.users",
            locale: "menu.system.users",
            icon: "UserOutlined",
            access: PERMISSIONS.USER_QUERY,
            component: lazy(() => import("../pages/System/Users")),
          },
          {
            path: "/system/roles",
            name: "menu.system.roles",
            locale: "menu.system.roles",
            icon: "SafetyCertificateOutlined",
            access: PERMISSIONS.ROLE_QUERY,
            component: lazy(() => import("../pages/System/Roles")),
          },
          {
            path: "/system/menus",
            name: "menu.system.menus",
            locale: "menu.system.menus",
            icon: "MenuOutlined",
            access: PERMISSIONS.MENU_QUERY,
            component: lazy(() => import("../pages/System/Menus")),
          },
          {
            path: "/system/apis",
            name: "menu.system.apis",
            locale: "menu.system.apis",
            icon: "ApiOutlined",
            access: PERMISSIONS.API_QUERY,
            component: lazy(() => import("../pages/System/Apis")),
          },
          {
            path: "/system/dicts",
            name: "menu.system.dicts",
            locale: "menu.system.dicts",
            icon: "BookOutlined",
            access: PERMISSIONS.DICT_VIEW,
            component: lazy(() => import("../pages/System/Dicts")),
          },
          {
            path: "/system/logs",
            name: "menu.system.logs",
            locale: "menu.system.logs",
            icon: "HistoryOutlined",
            access: PERMISSIONS.LOG_VIEW,
            component: lazy(() => import("../pages/System/Logs")),
          },
          {
            path: "/system/online",
            name: "menu.system.online",
            locale: "menu.system.online",
            icon: "TeamOutlined",
            access: PERMISSIONS.ONLINE_QUERY,
            component: lazy(() => import("../pages/System/Online")),
          },
          {
            path: "/system/openapi",
            name: "menu.system.openapi",
            locale: "menu.system.openapi",
            icon: "ApiOutlined",
            component: lazy(() => import("../pages/System/OpenApi")),
          },
          {
            path: "/system/sys-notice",
            name: "通知公告表",
            locale: "menu.system.sysnotice",
            icon: "ClusterOutlined",
            component: lazy(() => import("../pages/SysNotice")),
          },
          {
            path: "/system/sys-post",
            name: "岗位信息表",
            locale: "menu.system.syspost",
            icon: "ClusterOutlined",
            component: lazy(() => import("../pages/SysPost")),
          },
        ],
      },

      // 个人设置中心
      {
        path: "/account/settings",
        name: "menu.account.settings",
        locale: "menu.account.settings",
        hideInMenu: true,
        component: lazy(() => import("../pages/Account/Settings")),
      },

      // 异常状态页
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

  // 3. 兜底未匹配路由 (404 Not Found)
  {
    path: "*",
    component: lazy(() => import("../pages/Exception/404")),
    layout: false,
  },
];

export default routes;
