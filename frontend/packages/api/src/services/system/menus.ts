import {
  getSysMenuTree,
  getPermissionTree,
  type GetSysMenuTreeResp,
  type SysMenuItem,
} from "../../gateway";

export const systemMenusApi = {
  getTree: getSysMenuTree,
  getPermissionTree: getPermissionTree,
};

export default systemMenusApi;
