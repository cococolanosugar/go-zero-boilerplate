export const mockMenus = [
  {
    id: 1,
    parentId: 0,
    title: "仪表盘",
    type: 2,
    path: "/dashboard",
    component: "Dashboard",
    permissionCode: "dashboard:view",
    icon: "DashboardOutlined",
    sort: 1,
  },
  {
    id: 2,
    parentId: 0,
    title: "订单管理",
    type: 2,
    path: "/orders",
    component: "Orders",
    permissionCode: "order:view",
    icon: "ShoppingCartOutlined",
    sort: 2,
  },
  {
    id: 3,
    parentId: 0,
    title: "用户中心",
    type: 2,
    path: "/users",
    component: "Users",
    permissionCode: "user:view",
    icon: "UserOutlined",
    sort: 3,
  },
  {
    id: 10,
    parentId: 0,
    title: "系统治理",
    type: 1,
    path: "/system",
    component: "Layout",
    permissionCode: "system:manage",
    icon: "SettingOutlined",
    sort: 10,
    children: [
      {
        id: 11,
        parentId: 10,
        title: "员工管理",
        type: 2,
        path: "/system/users",
        component: "System/Users",
        permissionCode: "system:user:query",
        icon: "UserOutlined",
        sort: 1,
      },
      {
        id: 12,
        parentId: 10,
        title: "角色管理",
        type: 2,
        path: "/system/roles",
        component: "System/Roles",
        permissionCode: "system:role:query",
        icon: "SafetyCertificateOutlined",
        sort: 2,
      },
      {
        id: 13,
        parentId: 10,
        title: "菜单权限",
        type: 2,
        path: "/system/menus",
        component: "System/Menus",
        permissionCode: "system:menu:query",
        icon: "MenuOutlined",
        sort: 3,
      },
      {
        id: 14,
        parentId: 10,
        title: "接口字典",
        type: 2,
        path: "/system/apis",
        component: "System/Apis",
        permissionCode: "system:api:query",
        icon: "ApiOutlined",
        sort: 4,
      },
      {
        id: 15,
        parentId: 10,
        title: "数据字典",
        type: 2,
        path: "/system/dicts",
        component: "System/Dicts",
        permissionCode: "system:dict:view",
        icon: "BookOutlined",
        sort: 5,
      },
    ],
  },
  {
    id: 20,
    parentId: 0,
    title: "系统监控",
    type: 1,
    path: "/monitor",
    icon: "FundProjectionScreenOutlined",
    sort: 4,
    children: [
      {
        id: 21,
        parentId: 20,
        title: "在线用户",
        type: 2,
        path: "/monitor/online",
        component: "System/Online",
        permissionCode: "system:online:view",
        icon: "TeamOutlined",
        sort: 1,
      },
      {
        id: 22,
        parentId: 20,
        title: "审计日志",
        type: 2,
        path: "/monitor/logs",
        component: "System/Logs",
        permissionCode: "system:log:view",
        icon: "HistoryOutlined",
        sort: 2,
      },
      {
        id: 23,
        parentId: 20,
        title: "接口文档",
        type: 2,
        path: "/monitor/openapi",
        component: "System/OpenApi",
        permissionCode: "system:openapi:view",
        icon: "FileTextOutlined",
        sort: 3,
      },
    ],
  },
];

export const mockAdminProfile = {
  id: 1,
  username: "admin",
  realName: "超级管理员 (Mock 离线开发模式)",
  mobile: "13800138000",
  email: "admin@example.com",
  avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
  deptName: "核心研发架构部",
  roles: ["ROLE_ADMIN"],
  permissions: ["*"],
  menus: mockMenus,
};

export default {
  // 员工 / 管理员后台登录
  "POST /api/v1/system/auth/login": (req: any, res: any) => {
    const { account, username, password } = req.body || {};
    const user = account || username;
    if (user === "admin" && (password === "123456" || password === "admin123")) {
      res.json({
        code: 200,
        msg: "SUCCESS",
        data: {
          accessToken: "mock-jwt-admin-token-2026",
          accessExpire: 7200,
          refreshAfter: 3600,
          userId: 1,
          username: "admin",
          realName: "超级管理员 (Mock)",
          avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
          roles: ["ROLE_ADMIN"],
        },
      });
      return;
    }
    res.json({
      code: 100001,
      msg: "用户名或密码错误（Mock 提示：admin / 123456）",
    });
  },

  // 门户用户登录
  "POST /api/v1/user/login": (req: any, res: any) => {
    const { mobile, password } = req.body || {};
    if (mobile === "13800000000" && password === "123456") {
      res.json({
        code: 200,
        msg: "SUCCESS",
        data: {
          accessToken: "mock-jwt-portal-token-2026",
          accessExpire: 7200,
          refreshAfter: 3600,
          userId: 1,
          username: "portal_user",
        },
      });
      return;
    }
    res.json({
      code: 100001,
      msg: "手机号或密码错误（Mock 提示：13800000000 / 123456）",
    });
  },

  // 管理员个人资料与动态权限画像
  "GET /api/v1/system/personal/profile": {
    code: 200,
    msg: "SUCCESS",
    data: mockAdminProfile,
  },

  // 兼容别名路由
  "GET /api/v1/system/auth/profile": {
    code: 200,
    msg: "SUCCESS",
    data: mockAdminProfile,
  },

  // 微服务用户信息
  "GET /api/v1/user/info": {
    code: 200,
    msg: "SUCCESS",
    data: {
      id: 1,
      name: "管理员用户 (Mock)",
      mobile: "13800138000",
      avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    },
  },
};
