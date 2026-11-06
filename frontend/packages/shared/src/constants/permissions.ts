/**
 * 全局强类型业务权限点常量字典 (与后端 app/gateway/internal/perm 对齐)
 */
export const PERMISSIONS = {
  USER: {
    LIST: 'system:user:list',
    CREATE: 'system:user:create',
    UPDATE: 'system:user:update',
    DELETE: 'system:user:delete',
    RESET_PWD: 'system:user:reset_pwd',
    EXPORT: 'system:user:export',
  },
  ROLE: {
    LIST: 'system:role:list',
    CREATE: 'system:role:create',
    UPDATE: 'system:role:update',
    DELETE: 'system:role:delete',
    SET_PERMISSIONS: 'system:role:set_permissions',
  },
  DEPT: {
    LIST: 'system:dept:list',
    CREATE: 'system:dept:create',
    UPDATE: 'system:dept:update',
    DELETE: 'system:dept:delete',
  },
  MENU: {
    LIST: 'system:menu:list',
    CREATE: 'system:menu:create',
    UPDATE: 'system:menu:update',
    DELETE: 'system:menu:delete',
  },
  DICT: {
    TYPE_LIST: 'system:dict_type:list',
    TYPE_CREATE: 'system:dict_type:create',
    TYPE_UPDATE: 'system:dict_type:update',
    TYPE_DELETE: 'system:dict_type:delete',
    DATA_LIST: 'system:dict_data:list',
    DATA_CREATE: 'system:dict_data:create',
    DATA_UPDATE: 'system:dict_data:update',
    DATA_DELETE: 'system:dict_data:delete',
  },
  ITSM: {
    PROCESS_DEF_LIST: 'itsm:process_def:list',
    PROCESS_DEF_CREATE: 'itsm:process_def:create',
    PROCESS_DEF_DEPLOY: 'itsm:process_def:deploy',
    TICKET_LIST: 'itsm:ticket:list',
    TICKET_CREATE: 'itsm:ticket:create',
    TICKET_DETAIL: 'itsm:ticket:detail',
    TICKET_APPROVE: 'itsm:ticket:approve',
    TICKET_REJECT: 'itsm:ticket:reject',
    TICKET_TRANSFER: 'itsm:ticket:transfer',
    TICKET_CANCEL: 'itsm:ticket:cancel',
    SLA_LIST: 'itsm:sla:list',
    SLA_UPDATE: 'itsm:sla:update',
  },
} as const;

export type PermissionCode =
  | typeof PERMISSIONS.USER[keyof typeof PERMISSIONS.USER]
  | typeof PERMISSIONS.ROLE[keyof typeof PERMISSIONS.ROLE]
  | typeof PERMISSIONS.DEPT[keyof typeof PERMISSIONS.DEPT]
  | typeof PERMISSIONS.MENU[keyof typeof PERMISSIONS.MENU]
  | typeof PERMISSIONS.DICT[keyof typeof PERMISSIONS.DICT]
  | typeof PERMISSIONS.ITSM[keyof typeof PERMISSIONS.ITSM];
