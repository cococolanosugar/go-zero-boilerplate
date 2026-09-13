export const APP_NAME = "Go-Zero Boilerplate";

export function formatPrice(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export const PERMISSIONS = {
  // 员工管理
  USER_QUERY: 'system:user:query',
  USER_ADD: 'system:user:add',
  USER_EDIT: 'system:user:edit',
  USER_DELETE: 'system:user:delete',

  // 角色管理
  ROLE_QUERY: 'system:role:query',
  ROLE_ADD: 'system:role:add',
  ROLE_EDIT: 'system:role:edit',
  ROLE_DELETE: 'system:role:delete',
  ROLE_ASSIGN: 'system:role:assign',

  // 菜单管理
  MENU_QUERY: 'system:menu:query',
  MENU_ADD: 'system:menu:add',
  MENU_EDIT: 'system:menu:edit',
  MENU_DELETE: 'system:menu:delete',

  // 接口字典
  API_QUERY: 'system:api:query',
  API_SYNC: 'system:api:sync',

  // 数据字典
  DICT_VIEW: 'system:dict:view',
  DICT_TYPE_ADD: 'system:dict:type:add',
  DICT_TYPE_EDIT: 'system:dict:type:edit',
  DICT_TYPE_DELETE: 'system:dict:type:delete',
  DICT_DATA_ADD: 'system:dict:data:add',
  DICT_DATA_EDIT: 'system:dict:data:edit',
  DICT_DATA_DELETE: 'system:dict:data:delete',

  // 审计日志
  LOG_VIEW: 'system:log:view',
  LOG_OPER_QUERY: 'system:log:oper:query',
  LOG_LOGIN_QUERY: 'system:log:login:query',

  // 在线用户监控
  ONLINE_QUERY: 'system:online:query',
  ONLINE_FORCE: 'system:online:force',

  // 通知公告
  NOTICE_VIEW: 'system:notice:view',
  NOTICE_ADD: 'system:notice:add',
  NOTICE_EDIT: 'system:notice:edit',
  NOTICE_DELETE: 'system:notice:delete',

  // 异步任务管理
  TASK_VIEW: 'system:task:view',
  TASK_ADD: 'system:task:add',
  TASK_EDIT: 'system:task:edit',
  TASK_DELETE: 'system:task:delete',
  TASK_TRIGGER: 'system:task:trigger',

  // 网址导航管理
  NAV_VIEW: 'system:navigation:list',
  NAV_ADD: 'system:navigation:create',
  NAV_EDIT: 'system:navigation:update',
  NAV_DELETE: 'system:navigation:delete',
} as const;

export * from "./sessionSync";
export * from "./utils/masking";
export * from "./utils/clipboard";
export * from "./utils/timing";
export * from "./utils/exportCsv";
export * from "./utils/storage";
export * from "./utils/download";
export * from "./utils/casdoor";
export * from "./hooks/useAbortController";
