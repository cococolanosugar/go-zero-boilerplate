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
} as const;
