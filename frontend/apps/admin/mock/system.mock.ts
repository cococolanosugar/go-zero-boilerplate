import { mockMenus } from "./auth.mock";

// 1. 系统员工初始数据集
let mockUsers = [
  {
    id: 1,
    deptId: 1,
    deptName: "核心架构研发部",
    username: "admin",
    realName: "超级管理员 (Mock)",
    mobile: "13800138000",
    email: "admin@example.com",
    avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    status: 1,
    roleNames: ["超级管理员"],
    roleIds: [1],
    createTime: "2026-01-01 00:00:00",
  },
  {
    id: 2,
    deptId: 1,
    deptName: "核心架构研发部",
    username: "dev_lead",
    realName: "架构总监",
    mobile: "13800138001",
    email: "dev@example.com",
    avatar: "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
    status: 1,
    roleNames: ["研发负责人"],
    roleIds: [2],
    createTime: "2026-03-15 10:20:00",
  },
  {
    id: 3,
    deptId: 2,
    deptName: "客户成功与支持中心",
    username: "support_user",
    realName: "业务支持专员",
    mobile: "13800138002",
    email: "support@example.com",
    avatar: "https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png",
    status: 1,
    roleNames: ["标准操作员"],
    roleIds: [3],
    createTime: "2026-05-20 14:30:00",
  },
];

// 2. 角色初始数据集
let mockRoles = [
  {
    id: 1,
    name: "超级管理员",
    code: "ROLE_ADMIN",
    sort: 1,
    dataScope: 1,
    status: 1,
    description: "拥有系统全量治理权限与所有业务数据范围",
    menuIds: [1, 2, 3, 10, 11, 12, 13, 14, 15, 16],
    createTime: "2026-01-01 00:00:00",
  },
  {
    id: 2,
    name: "研发负责人",
    code: "ROLE_DEV",
    sort: 2,
    dataScope: 2,
    status: 1,
    description: "技术线治理角色，支持查看微服务监控、接口与日志",
    menuIds: [1, 2, 3, 10, 11, 14, 15, 16],
    createTime: "2026-02-10 11:00:00",
  },
  {
    id: 3,
    name: "标准操作员",
    code: "ROLE_USER",
    sort: 3,
    dataScope: 4,
    status: 1,
    description: "业务线角色，仅可访问订单管理与个人中心",
    menuIds: [1, 2],
    createTime: "2026-04-12 16:40:00",
  },
];

// 3. 接口字典数据集
const mockApis = [
  { id: 1, apiGroup: "Auth", title: "员工/超管登录", path: "/api/v1/system/auth/login", method: "POST", isAutoSync: 1 },
  { id: 2, apiGroup: "Auth", title: "用户端登录", path: "/api/v1/user/login", method: "POST", isAutoSync: 1 },
  { id: 3, apiGroup: "System", title: "员工列表", path: "/api/v1/system/users", method: "GET", isAutoSync: 1 },
  { id: 4, apiGroup: "System", title: "角色列表", path: "/api/v1/system/roles", method: "GET", isAutoSync: 1 },
  { id: 5, apiGroup: "System", title: "全量菜单树", path: "/api/v1/system/menus/tree", method: "GET", isAutoSync: 1 },
  { id: 6, apiGroup: "System", title: "接口字典", path: "/api/v1/system/apis", method: "GET", isAutoSync: 1 },
  { id: 7, apiGroup: "System", title: "字典类型", path: "/api/v1/system/dict/types", method: "GET", isAutoSync: 1 },
  { id: 8, apiGroup: "System", title: "字典数据", path: "/api/v1/system/dict/data", method: "GET", isAutoSync: 1 },
  { id: 9, apiGroup: "System", title: "操作日志", path: "/api/v1/system/logs/oper", method: "GET", isAutoSync: 1 },
  { id: 11, apiGroup: "Dashboard", title: "大盘监控", path: "/api/v1/dashboard/overview", method: "GET", isAutoSync: 1 },
];

// 4. 字典类型数据集
let mockDictTypes = [
  { id: 1, dictName: "用户性别", dictType: "sys_user_sex", status: 1, remark: "性别字典枚举", createTime: "2026-01-10 10:00:00" },
  { id: 2, dictName: "启用状态", dictType: "sys_normal_disable", status: 1, remark: "通用停用/启用状态", createTime: "2026-01-10 10:05:00" },
  { id: 3, dictName: "操作类型", dictType: "sys_oper_type", status: 1, remark: "审计日志操作类型", createTime: "2026-01-10 10:10:00" },
];

// 5. 字典数据项数据集
let mockDictData = [
  { id: 1, dictType: "sys_user_sex", dictLabel: "男", dictValue: "1", dictSort: 1, listClass: "default", isDefault: 1, status: 1, remark: "男", createTime: "2026-01-10 10:01:00" },
  { id: 2, dictType: "sys_user_sex", dictLabel: "女", dictValue: "2", dictSort: 2, listClass: "default", isDefault: 0, status: 1, remark: "女", createTime: "2026-01-10 10:02:00" },
  { id: 3, dictType: "sys_user_sex", dictLabel: "保密", dictValue: "0", dictSort: 3, listClass: "info", isDefault: 0, status: 1, remark: "未知/保密", createTime: "2026-01-10 10:03:00" },
  { id: 4, dictType: "sys_normal_disable", dictLabel: "正常", dictValue: "1", dictSort: 1, listClass: "success", isDefault: 1, status: 1, remark: "启用", createTime: "2026-01-10 10:06:00" },
  { id: 5, dictType: "sys_normal_disable", dictLabel: "停用", dictValue: "0", dictSort: 2, listClass: "danger", isDefault: 0, status: 1, remark: "停用", createTime: "2026-01-10 10:07:00" },
];

// 6. 审计日志数据集
const mockOperLogs = [
  { id: 1, title: "系统登录", operName: "admin", operUrl: "/api/v1/system/auth/login", operMethod: "POST", operIp: "127.0.0.1", status: 1, errorMsg: "", costTime: 23, createTime: "2026-09-08 23:45:12" },
  { id: 2, title: "分配角色权限", operName: "admin", operUrl: "/api/v1/system/roles/permissions", operMethod: "POST", operIp: "127.0.0.1", status: 1, errorMsg: "", costTime: 38, createTime: "2026-09-08 23:50:04" },
  { id: 3, title: "更新字典类型", operName: "admin", operUrl: "/api/v1/system/dict/types", operMethod: "PUT", operIp: "127.0.0.1", status: 1, errorMsg: "", costTime: 19, createTime: "2026-09-09 00:01:22" },
];

const mockLoginLogs = [
  { id: 1, username: "admin", loginIp: "127.0.0.1", browser: "Chrome 130", os: "Windows 11", status: 1, msg: "登录成功", loginTime: "2026-09-08 23:45:12" },
  { id: 2, username: "dev_lead", loginIp: "192.168.1.102", browser: "Safari 18", os: "macOS 15", status: 1, msg: "登录成功", loginTime: "2026-09-08 22:30:10" },
  { id: 3, username: "unknown", loginIp: "114.114.114.114", browser: "Firefox 130", os: "Linux", status: 0, msg: "密码校验失败", loginTime: "2026-09-08 21:10:05" },
];

export default {
  // 员工管理
  "GET /api/v1/system/users": (req: any, res: any) => {
    const { keyword = "" } = req.query || {};
    let filtered = mockUsers;
    if (keyword) {
      filtered = filtered.filter(
        (u) =>
          u.username.includes(keyword) ||
          u.realName.includes(keyword) ||
          u.mobile.includes(keyword)
      );
    }
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        total: filtered.length,
        list: filtered,
      },
    });
  },

  "POST /api/v1/system/users": (req: any, res: any) => {
    const body = req.body || {};
    const newId = Date.now();
    const newUser = {
      id: newId,
      deptId: body.deptId || 1,
      deptName: "技术研发部",
      username: body.username || `user_${newId.toString().slice(-4)}`,
      realName: body.realName || "新增员工",
      mobile: body.mobile || "13800000000",
      email: body.email || "user@example.com",
      avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
      status: 1,
      roleNames: ["标准操作员"],
      roleIds: body.roleIds || [3],
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    mockUsers.unshift(newUser);
    res.json({ code: 200, msg: "SUCCESS", data: { id: newId } });
  },

  "PUT /api/v1/system/users": (req: any, res: any) => {
    const body = req.body || {};
    const index = mockUsers.findIndex((u) => u.id === body.id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...body };
    }
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  "DELETE /api/v1/system/users/:id": (req: any, res: any) => {
    const id = Number(req.params?.id);
    mockUsers = mockUsers.filter((u) => u.id !== id);
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  // 角色管理
  "GET /api/v1/system/roles": (req: any, res: any) => {
    const { keyword = "" } = req.query || {};
    let filtered = mockRoles;
    if (keyword) {
      filtered = filtered.filter(
        (r) => r.name.includes(keyword) || r.code.includes(keyword)
      );
    }
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        total: filtered.length,
        list: filtered,
      },
    });
  },

  "POST /api/v1/system/roles": (req: any, res: any) => {
    const body = req.body || {};
    const newId = Date.now();
    const newRole = {
      id: newId,
      name: body.name || "新角色",
      code: body.code || `ROLE_${newId.toString().slice(-4)}`,
      sort: body.sort || mockRoles.length + 1,
      dataScope: body.dataScope || 4,
      status: 1,
      description: body.description || "",
      menuIds: [],
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    mockRoles.push(newRole);
    res.json({ code: 200, msg: "SUCCESS", data: { id: newId } });
  },

  "PUT /api/v1/system/roles": (req: any, res: any) => {
    const body = req.body || {};
    const index = mockRoles.findIndex((r) => r.id === body.id);
    if (index !== -1) {
      mockRoles[index] = { ...mockRoles[index], ...body };
    }
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  "DELETE /api/v1/system/roles/:id": (req: any, res: any) => {
    const id = Number(req.params?.id);
    mockRoles = mockRoles.filter((r) => r.id !== id);
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  "POST /api/v1/system/roles/permissions": (req: any, res: any) => {
    const { roleId, menuIds } = req.body || {};
    const role = mockRoles.find((r) => r.id === roleId);
    if (role) {
      role.menuIds = menuIds || [];
    }
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  // 菜单与权限树
  "GET /api/v1/system/menus/tree": {
    code: 200,
    msg: "SUCCESS",
    data: {
      list: mockMenus,
    },
  },

  // 接口字典
  "GET /api/v1/system/apis": {
    code: 200,
    msg: "SUCCESS",
    data: {
      list: mockApis,
    },
  },

  // 字典类型
  "GET /api/v1/system/dict/types": (req: any, res: any) => {
    const { keyword = "" } = req.query || {};
    let filtered = mockDictTypes;
    if (keyword) {
      filtered = filtered.filter(
        (t) => t.dictName.includes(keyword) || t.dictType.includes(keyword)
      );
    }
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        total: filtered.length,
        list: filtered,
      },
    });
  },

  "POST /api/v1/system/dict/types": (req: any, res: any) => {
    const body = req.body || {};
    const newId = Date.now();
    const item = {
      id: newId,
      dictName: body.dictName || "新字典",
      dictType: body.dictType || `dict_${newId.toString().slice(-4)}`,
      status: body.status ?? 1,
      remark: body.remark || "",
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    mockDictTypes.push(item);
    res.json({ code: 200, msg: "SUCCESS", data: { id: newId } });
  },

  "PUT /api/v1/system/dict/types": (req: any, res: any) => {
    const body = req.body || {};
    const index = mockDictTypes.findIndex((t) => t.id === body.id);
    if (index !== -1) {
      mockDictTypes[index] = { ...mockDictTypes[index], ...body };
    }
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  "DELETE /api/v1/system/dict/types/:id": (req: any, res: any) => {
    const id = Number(req.params?.id);
    mockDictTypes = mockDictTypes.filter((t) => t.id !== id);
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  // 字典数据项
  "GET /api/v1/system/dict/data": (req: any, res: any) => {
    const { dictType = "", keyword = "" } = req.query || {};
    let filtered = mockDictData;
    if (dictType) {
      filtered = filtered.filter((d) => d.dictType === dictType);
    }
    if (keyword) {
      filtered = filtered.filter(
        (d) => d.dictLabel.includes(keyword) || d.dictValue.includes(keyword)
      );
    }
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        total: filtered.length,
        list: filtered,
      },
    });
  },

  "GET /api/v1/system/dict/data/type/:dictType": (req: any, res: any) => {
    const dictType = req.params?.dictType;
    const list = mockDictData.filter((d) => d.dictType === dictType);
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        list,
      },
    });
  },

  "POST /api/v1/system/dict/data": (req: any, res: any) => {
    const body = req.body || {};
    const newId = Date.now();
    const item = {
      id: newId,
      dictType: body.dictType,
      dictLabel: body.dictLabel,
      dictValue: body.dictValue,
      dictSort: body.dictSort ?? mockDictData.length + 1,
      listClass: body.listClass || "default",
      isDefault: body.isDefault ?? 0,
      status: body.status ?? 1,
      remark: body.remark || "",
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    mockDictData.push(item);
    res.json({ code: 200, msg: "SUCCESS", data: { id: newId } });
  },

  "PUT /api/v1/system/dict/data": (req: any, res: any) => {
    const body = req.body || {};
    const index = mockDictData.findIndex((d) => d.id === body.id);
    if (index !== -1) {
      mockDictData[index] = { ...mockDictData[index], ...body };
    }
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  "DELETE /api/v1/system/dict/data/:id": (req: any, res: any) => {
    const id = Number(req.params?.id);
    mockDictData = mockDictData.filter((d) => d.id !== id);
    res.json({ code: 200, msg: "SUCCESS", data: { success: true } });
  },

  // 审计日志
  "GET /api/v1/system/logs/oper": (req: any, res: any) => {
    const { operName = "", title = "" } = req.query || {};
    let filtered = mockOperLogs;
    if (operName) {
      filtered = filtered.filter((l) => l.operName.includes(operName));
    }
    if (title) {
      filtered = filtered.filter((l) => l.title.includes(title));
    }
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        total: filtered.length,
        list: filtered,
      },
    });
  },

  "GET /api/v1/system/logs/login": (req: any, res: any) => {
    const { username = "" } = req.query || {};
    let filtered = mockLoginLogs;
    if (username) {
      filtered = filtered.filter((l) => l.username.includes(username));
    }
    res.json({
      code: 200,
      msg: "SUCCESS",
      data: {
        total: filtered.length,
        list: filtered,
      },
    });
  },
};
