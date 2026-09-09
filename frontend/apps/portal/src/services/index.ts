import {
  authService,
  userService,
  orderService,
  dashboardService,
  systemService,
  systemUsersApi,
  systemRolesApi,
  systemMenusApi,
  systemApisApi,
  systemDictsApi,
  systemLogsApi,
  toProTableRequest,
} from "@zero/api";

export {
  authService,
  userService,
  orderService,
  dashboardService,
  systemService,
  systemUsersApi,
  systemRolesApi,
  systemMenusApi,
  systemApisApi,
  systemDictsApi,
  systemLogsApi,
  toProTableRequest,
};

export const services = {
  auth: authService,
  user: userService,
  order: orderService,
  dashboard: dashboardService,
  system: systemService,
};

export default services;