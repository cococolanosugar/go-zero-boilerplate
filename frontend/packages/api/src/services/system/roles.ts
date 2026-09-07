import {
  listSysRoles,
  createSysRole,
  updateSysRole,
  deleteSysRole,
  assignRolePermissions,
  type ListSysRolesReqParams,
  type ListSysRolesResp,
  type CreateSysRoleReq,
  type UpdateSysRoleReq,
  type AssignRolePermReq,
  type SysIdReqParams,
  type SysIdResp,
  type SysEmptyResp,
  type SysRoleItem,
} from "../../gateway";

export const systemRolesApi = {
  list: listSysRoles,
  create: createSysRole,
  update: updateSysRole,
  remove: deleteSysRole,
  assignPermissions: assignRolePermissions,
};

export default systemRolesApi;
