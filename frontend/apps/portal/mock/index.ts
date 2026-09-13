export const mockMenus = [
  {
    id: 1,
    parentId: 0,
    title: "门户首页",
    type: 2,
    path: "/",
    component: "Home",
    permissionCode: "portal:home:view",
    icon: "HomeOutlined",
    sort: 1,
  },
  {
    id: 2,
    parentId: 0,
    title: "微服务全景",
    type: 2,
    path: "/services",
    component: "Services",
    permissionCode: "portal:services:view",
    icon: "AppstoreOutlined",
    sort: 2,
  },
  {
    id: 3,
    parentId: 0,
    title: "联调工作台",
    type: 2,
    path: "/workbench",
    component: "Workbench",
    permissionCode: "portal:workbench:view",
    icon: "CodeOutlined",
    sort: 3,
  },
];

export const mockAdminProfile = {
  id: 1,
  username: "admin",
  realName: "超级管理员 (Portal Mock)",
  mobile: "13800138000",
  email: "admin@example.com",
  avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
  deptName: "核心研发架构部",
  roles: ["ROLE_ADMIN"],
  permissions: ["*"],
  menus: mockMenus,
};

export const mockApis = [
  { id: 1, apiGroup: "Auth", title: "员工/超管登录", path: "/api/v1/system/auth/login", method: "POST", isAutoSync: 1 },
  { id: 2, apiGroup: "Auth", title: "用户端登录", path: "/api/v1/user/login", method: "POST", isAutoSync: 1 },
  { id: 3, apiGroup: "System", title: "员工个人画像", path: "/api/v1/system/personal/profile", method: "GET", isAutoSync: 1 },
  { id: 4, apiGroup: "System", title: "全量菜单树", path: "/api/v1/system/menus/tree", method: "GET", isAutoSync: 1 },
  { id: 5, apiGroup: "System", title: "接口字典", path: "/api/v1/system/apis", method: "GET", isAutoSync: 1 },
  { id: 6, apiGroup: "Dashboard", title: "大盘监控", path: "/api/v1/dashboard/overview", method: "GET", isAutoSync: 1 },
];

export const mockData = {
  // 1. 系统员工/超管登录
  "POST /api/v1/system/auth/login": (req: any, res: any) => {
    const { account, username, password } = req.body || {};
    const user = account || username;
    if (user === "admin" && (password === "123456" || password === "admin123")) {
      res.json({
        code: 200,
        msg: "SUCCESS",
        data: {
          accessToken: "mock-jwt-portal-admin-token-2026",
          accessExpire: 7200,
          refreshAfter: 3600,
          userId: 1,
          username: "admin",
          realName: "超级管理员 (Portal Mock)",
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

  // 2. 手机号用户登录
  "POST /api/v1/user/login": (req: any, res: any) => {
    const { mobile, password } = req.body || {};
    if (mobile === "13800000000" && password === "123456") {
      res.json({
        code: 200,
        msg: "SUCCESS",
        data: {
          accessToken: "mock-jwt-portal-user-token-2026",
          accessExpire: 7200,
          refreshAfter: 3600,
          userId: 2,
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

  // 3. 员工资料
  "GET /api/v1/system/personal/profile": {
    code: 200,
    msg: "SUCCESS",
    data: mockAdminProfile,
  },

  // 4. 用户信息
  "GET /api/v1/user/info": {
    code: 200,
    msg: "SUCCESS",
    data: {
      id: 2,
      name: "门户注册会员 (Mock)",
      mobile: "13800000000",
      avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    },
  },

  // 5. 大盘聚合（mr.Finish 模拟）
  "GET /api/v1/dashboard/overview": {
    code: 200,
    msg: "SUCCESS",
    data: {
      userInfo: {
        id: 1,
        name: "超级管理员 (Mock)",
        mobile: "13800138000",
        avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
      },
      systemStats: {
        totalUsers: 128,
        activeTasks: 4,
        completedTasks: 36,
        successRate: 99.8,
      },
      sysTime: Date.now(),
    },
  },

  // 6. 菜单树
  "GET /api/v1/system/menus/tree": {
    code: 200,
    msg: "SUCCESS",
    data: {
      list: mockMenus,
    },
  },

  // 7. 接口字典
  "GET /api/v1/system/apis": {
    code: 200,
    msg: "SUCCESS",
    data: {
      list: mockApis,
    },
  },
};

export { vitePluginMock } from "./mockPlugin";
export default mockData;
