export * from "./users";
export * from "./roles";
export * from "./menus";
export * from "./apis";
export * from "./dicts";
export * from "./logs";

import { systemUsersApi } from "./users";
import { systemRolesApi } from "./roles";
import { systemMenusApi } from "./menus";
import { systemApisApi } from "./apis";
import { systemDictsApi } from "./dicts";
import { systemLogsApi } from "./logs";

export const systemService = {
  users: systemUsersApi,
  roles: systemRolesApi,
  menus: systemMenusApi,
  apis: systemApisApi,
  dicts: systemDictsApi,
  logs: systemLogsApi,
};

export default systemService;
