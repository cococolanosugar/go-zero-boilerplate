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
        hideInMenu: true,
        component: lazy(() => import("../pages/Form/StepForm")),
      },
      {
        path: "/profile/advanced",
        name: "menu.profile.advanced",
        locale: "menu.profile.advanced",
        icon: "ProfileOutlined",
        hideInMenu: true,
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
        path: "/users",
        name: "menu.users",
        locale: "menu.users",
        icon: "UserOutlined",
        component: lazy(() => import("../pages/Users")),
      },

      // 企业级组织架构治理模块 (Organization Governance - 人·岗·部 实体闭环)
      {
        path: "/org",
        name: "menu.org",
        locale: "menu.org",
        icon: "ApartmentOutlined",
        access: "system:manage",
        routes: [
          {
            path: "/org",
            redirect: "/org/users",
          },
          {
            path: "/org/users",
            name: "menu.org.users",
            locale: "menu.org.users",
            icon: "UserOutlined",
            access: PERMISSIONS.USER_QUERY,
            component: lazy(() => import("../pages/System/Users")),
          },
          {
            path: "/org/dept",
            name: "menu.org.dept",
            locale: "menu.org.dept",
            icon: "ApartmentOutlined",
            component: lazy(() => import("../pages/System/Dept")),
          },
          {
            path: "/org/post",
            name: "menu.org.post",
            locale: "menu.org.post",
            icon: "IdcardOutlined",
            component: lazy(() => import("../pages/SysPost")),
          },
        ],
      },

      // 企业级权限与访问控制模块 (IAM & Access Control - 角色与策略层)
      {
        path: "/permission",
        name: "menu.permission",
        locale: "menu.permission",
        icon: "SafetyCertificateOutlined",
        access: "system:manage",
        routes: [
          {
            path: "/permission",
            redirect: "/permission/roles",
          },
          {
            path: "/permission/roles",
            name: "menu.permission.roles",
            locale: "menu.permission.roles",
            icon: "SafetyCertificateOutlined",
            access: PERMISSIONS.ROLE_QUERY,
            component: lazy(() => import("../pages/System/Roles")),
          },
          {
            path: "/permission/menus",
            name: "menu.permission.menus",
            locale: "menu.permission.menus",
            icon: "MenuOutlined",
            access: PERMISSIONS.MENU_QUERY,
            component: lazy(() => import("../pages/System/Menus")),
          },
          // 兼容历史与过渡访问路径，平滑重定向至组织管理
          {
            path: "/permission/users",
            redirect: "/org/users",
          },
          {
            path: "/permission/dept",
            redirect: "/org/dept",
          },
          {
            path: "/permission/sys-post",
            redirect: "/org/post",
          },
        ],
      },

      // 企业级全员协同与通知中心 (Notice & Announcement - 独立一级路由)
      {
        path: "/notice",
        name: "menu.notice",
        locale: "menu.notice",
        icon: "BellOutlined",
        access: PERMISSIONS.NOTICE_VIEW,
        component: lazy(() => import("../pages/SysNotice")),
      },
      {
        path: "/sys-notice",
        redirect: "/notice",
      },

      // 企业网址导航中心 (Portal Navigation Hub - 独立一级路由)
      {
        path: "/navigation",
        name: "menu.navigation",
        locale: "menu.navigation",
        icon: "CompassOutlined",
        access: PERMISSIONS.NAV_VIEW,
        component: lazy(() => import("../pages/System/Navigation")),
      },
      {
        path: "/system/navigation",
        redirect: "/navigation",
      },

      // 企业级异步任务调度系统 (Temporal Async Task Management - 独立一级路由)
      {
        path: "/tasks",
        name: "menu.tasks",
        locale: "menu.tasks",
        icon: "ScheduleOutlined",
        access: PERMISSIONS.TASK_VIEW,
        component: lazy(() => import("../pages/SysTask")),
      },
      {
        path: "/task",
        redirect: "/tasks",
      },

      // 企业级 ITSM 服务管理与流程中心 (IT Service Management)
      {
        path: "/itsm",
        name: "menu.itsm",
        locale: "menu.itsm",
        icon: "BranchesOutlined",
        routes: [
          {
            path: "/itsm",
            redirect: "/itsm/tickets",
          },
          {
            path: "/itsm/tickets",
            name: "menu.itsm.tickets",
            locale: "menu.itsm.tickets",
            icon: "AuditOutlined",
            component: lazy(() => import("../pages/itsm/Tickets")),
          },
          {
            path: "/itsm/tickets/:id",
            name: "menu.itsm.ticket.detail",
            locale: "menu.itsm.ticket.detail",
            icon: "FileTextOutlined",
            hideInMenu: true,
            component: lazy(() => import("../pages/itsm/Tickets/Detail")),
          },
          {
            path: "/itsm/process-defs",
            name: "menu.itsm.processDefs",
            locale: "menu.itsm.processDefs",
            icon: "ApartmentOutlined",
            access: "system:manage",
            component: lazy(() => import("../pages/itsm/ProcessDefs")),
          },
        ],
      },

      // 企业级系统配置与治理模块 (System Configuration & Settings)
      {
        path: "/system",
        name: "menu.system",
        locale: "menu.system",
        icon: "SettingOutlined",
        access: "system:manage",
        routes: [
          {
            path: "/system",
            redirect: "/system/config",
          },
          {
            path: "/system/config",
            name: "menu.system.config",
            locale: "menu.system.config",
            icon: "SettingOutlined",
            component: lazy(() => import("../pages/SysConfig")),
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
            path: "/system/apis",
            name: "menu.system.apis",
            locale: "menu.system.apis",
            icon: "ApiOutlined",
            access: PERMISSIONS.API_QUERY,
            component: lazy(() => import("../pages/System/Apis")),
          },
          // 兼容历史访问路径，自动平滑重定向至通知公告、组织管理、权限管理与系统监控
          {
            path: "/system/sys-notice",
            redirect: "/notice",
          },
          {
            path: "/system/dept",
            redirect: "/org/dept",
          },
          {
            path: "/system/sys-post",
            redirect: "/org/post",
          },
          {
            path: "/system/users",
            redirect: "/org/users",
          },
          {
            path: "/system/roles",
            redirect: "/permission/roles",
          },
          {
            path: "/system/menus",
            redirect: "/permission/menus",
          },
          {
            path: "/system/sys-config",
            redirect: "/system/config",
          },
          {
            path: "/system/online",
            redirect: "/monitor/online",
          },
          {
            path: "/system/logs",
            redirect: "/monitor/logs",
          },
          {
            path: "/system/openapi",
            redirect: "/monitor/openapi",
          },
        ],
      },

      // 企业级系统监控模块
      {
        path: "/monitor",
        name: "menu.monitor",
        locale: "menu.monitor",
        icon: "FundProjectionScreenOutlined",
        routes: [
          {
            path: "/monitor",
            redirect: "/monitor/online",
          },
          {
            path: "/monitor/online",
            name: "menu.monitor.online",
            locale: "menu.monitor.online",
            icon: "TeamOutlined",
            access: PERMISSIONS.ONLINE_QUERY,
            component: lazy(() => import("../pages/System/Online")),
          },
          {
            path: "/monitor/logs",
            name: "menu.monitor.logs",
            locale: "menu.monitor.logs",
            icon: "HistoryOutlined",
            access: PERMISSIONS.LOG_VIEW,
            component: lazy(() => import("../pages/System/Logs")),
          },
          {
            path: "/monitor/openapi",
            name: "menu.monitor.openapi",
            locale: "menu.monitor.openapi",
            icon: "FileTextOutlined",
            hideInMenu: true,
            component: lazy(() => import("../pages/System/OpenApi")),
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
