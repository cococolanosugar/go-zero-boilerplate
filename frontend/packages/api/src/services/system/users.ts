import {
  listSysUsers,
  createSysUser,
  updateSysUser,
  deleteSysUser,
  type ListSysUsersReqParams,
  type ListSysUsersResp,
  type CreateSysUserReq,
  type UpdateSysUserReq,
  type SysIdReqParams,
  type SysIdResp,
  type SysEmptyResp,
  type SysUserItem,
} from "../../gateway";

export const systemUsersApi = {
  list: listSysUsers,
  create: createSysUser,
  update: updateSysUser,
  remove: deleteSysUser,
};

export default systemUsersApi;
