/**
 * 前端应用级全局常量集中定义（唯一事实源）
 */

/**
 * 浏览器本地持久化存储键名
 */
export const STORAGE_KEYS = {
  TOKEN: "token",
  LOCALE: "zero_admin_locale",
  LAYOUT_SETTINGS: "zero_admin_settings",
  TABS_HISTORY: "zero_admin_tabs",
  USER_INFO: "zero_admin_user_info",
} as const;

/**
 * 通用表格分页默认配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ["10", "20", "50", "100"],
} as const;

/**
 * 多标签页 (Multi-Tabs) 全局配置
 */
export const TABS_CONFIG = {
  HOME_PATH: "/dashboard",
  HOME_TITLE: "仪表盘",
  MAX_OPEN_TABS: 20,
} as const;

/**
 * 常用表单校验与业务正则表达式
 */
export const REGEXP = {
  // 中国大陆 11 位手机号
  MOBILE: /^1[3-9]\d{9}$/,
  // 基础邮箱格式
  EMAIL: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
  // 字母开头的 4-20 位账号
  ACCOUNT: /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/,
} as const;
