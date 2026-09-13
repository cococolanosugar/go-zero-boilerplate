import {
  authService,
  userService,
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
  dashboard: dashboardService,
  system: systemService,
};

export default services;