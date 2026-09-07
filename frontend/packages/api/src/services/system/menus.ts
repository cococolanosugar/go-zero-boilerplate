import {
  getSysMenuTree,
  type GetSysMenuTreeResp,
  type SysMenuItem,
} from "../../gateway";

export const systemMenusApi = {
  getTree: getSysMenuTree,
};

export default systemMenusApi;
