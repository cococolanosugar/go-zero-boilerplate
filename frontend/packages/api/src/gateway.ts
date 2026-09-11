import webapi from "./gocliRequest"
import * as components from "./gatewayComponents"
export * from "./gatewayComponents"

/**
 * @description "获取字典数据项列表"
 * @param params
 */
export function listSysDictData(params: components.ListSysDictDataReqParams) {
	return webapi.get<components.ListSysDictDataResp>(`/api/v1/system/dict/data`, params)
}

/**
 * @description "创建字典数据项"
 * @param req
 */
export function createSysDictData(req: components.CreateSysDictDataReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/system/dict/data`, req)
}

/**
 * @description "更新字典数据项"
 * @param req
 */
export function updateSysDictData(req: components.UpdateSysDictDataReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/system/dict/data`, req)
}

/**
 * @description "删除字典数据项"
 * @param params
 */
export function deleteSysDictData(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/system/dict/data/${id}`, params)
}

/**
 * @description "根据字典类型查询数据项列表"
 * @param params
 */
export function getDictDataByType(params: components.GetDictDataByTypeReqParams, dictType: string) {
	return webapi.get<components.GetDictDataByTypeResp>(`/api/v1/system/dict/data/type/${dictType}`, params)
}

/**
 * @description "获取字典类型列表"
 * @param params
 */
export function listSysDictTypes(params: components.ListSysDictTypesReqParams) {
	return webapi.get<components.ListSysDictTypesResp>(`/api/v1/system/dict/types`, params)
}

/**
 * @description "创建字典类型"
 * @param req
 */
export function createSysDictType(req: components.CreateSysDictTypeReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/system/dict/types`, req)
}

/**
 * @description "更新字典类型"
 * @param req
 */
export function updateSysDictType(req: components.UpdateSysDictTypeReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/system/dict/types`, req)
}

/**
 * @description "删除字典类型"
 * @param params
 */
export function deleteSysDictType(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/system/dict/types/${id}`, params)
}

/**
 * @description "获取大盘聚合信息（mr.Finish 内网并发拉取微服务）"
 * @param params
 */
export function getDashboardOverview(params: components.DashboardReqParams) {
	return webapi.get<components.DashboardResp>(`/api/v1/order/dashboard`, params)
}

/**
 * @description "获取订单详情（聚合订单与用户信息）"
 * @param params
 */
export function getOrderDetail(params: components.OrderDetailReqParams) {
	return webapi.get<components.OrderDetailResp>(`/api/v1/order/detail`, params)
}

/**
 * @description "获取岗位信息表列表"
 * @param params
 */
export function listSysPost(params: components.ListSysPostReqParams) {
	return webapi.get<components.ListSysPostResp>(`/api/v1/user/sys-post`, params)
}

/**
 * @description "创建岗位信息表"
 * @param req
 */
export function createSysPost(req: components.CreateSysPostReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/user/sys-post`, req)
}

/**
 * @description "更新岗位信息表"
 * @param req
 */
export function updateSysPost(req: components.UpdateSysPostReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/user/sys-post`, req)
}

/**
 * @description "获取岗位信息表详情"
 * @param params
 */
export function getSysPost(params: components.SysIdReqParams, id: number) {
	return webapi.get<components.SysPostItem>(`/api/v1/user/sys-post/${id}`, params)
}

/**
 * @description "删除岗位信息表"
 * @param params
 */
export function deleteSysPost(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/user/sys-post/${id}`, params)
}

/**
 * @description "Casdoor SSO 统一身份登录"
 * @param req
 */
export function casdoorLogin(req: components.CasdoorLoginReq) {
	return webapi.post<components.AdminLoginResp>(`/api/v1/system/auth/casdoor/login`, req)
}

/**
 * @description "管理员账号登录"
 * @param req
 */
export function adminLogin(req: components.AdminLoginReq) {
	return webapi.post<components.AdminLoginResp>(`/api/v1/system/auth/login`, req)
}

/**
 * @description "获取系统 API 字典列表"
 */
export function listSysApis() {
	return webapi.get<components.ListSysApisResp>(`/api/v1/system/apis`)
}

/**
 * @description "获取登录日志列表"
 * @param params
 */
export function listSysLoginLogs(params: components.ListSysLoginLogsReqParams) {
	return webapi.get<components.ListSysLoginLogsResp>(`/api/v1/system/logs/login`, params)
}

/**
 * @description "获取操作日志列表"
 * @param params
 */
export function listSysOperLogs(params: components.ListSysOperLogsReqParams) {
	return webapi.get<components.ListSysOperLogsResp>(`/api/v1/system/logs/oper`, params)
}

/**
 * @description "获取全量菜单与按钮树"
 */
export function getSysMenuTree() {
	return webapi.get<components.GetSysMenuTreeResp>(`/api/v1/system/menus/tree`)
}

/**
 * @description "获取当前登录员工画像与权限"
 */
export function getAdminProfile() {
	return webapi.get<components.AdminProfileResp>(`/api/v1/system/personal/profile`)
}

/**
 * @description "获取角色列表"
 * @param params
 */
export function listSysRoles(params: components.ListSysRolesReqParams) {
	return webapi.get<components.ListSysRolesResp>(`/api/v1/system/roles`, params)
}

/**
 * @description "创建角色"
 * @param req
 */
export function createSysRole(req: components.CreateSysRoleReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/system/roles`, req)
}

/**
 * @description "更新角色"
 * @param req
 */
export function updateSysRole(req: components.UpdateSysRoleReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/system/roles`, req)
}

/**
 * @description "删除角色"
 * @param params
 */
export function deleteSysRole(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/system/roles/${id}`, params)
}

/**
 * @description "分配角色菜单与按钮权限"
 * @param req
 */
export function assignRolePermissions(req: components.AssignRolePermReq) {
	return webapi.post<components.SysEmptyResp>(`/api/v1/system/roles/permissions`, req)
}

/**
 * @description "获取员工列表"
 * @param params
 */
export function listSysUsers(params: components.ListSysUsersReqParams) {
	return webapi.get<components.ListSysUsersResp>(`/api/v1/system/users`, params)
}

/**
 * @description "创建新员工"
 * @param req
 */
export function createSysUser(req: components.CreateSysUserReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/system/users`, req)
}

/**
 * @description "更新员工信息"
 * @param req
 */
export function updateSysUser(req: components.UpdateSysUserReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/system/users`, req)
}

/**
 * @description "删除员工"
 * @param params
 */
export function deleteSysUser(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/system/users/${id}`, params)
}

/**
 * @description "用户登录"
 * @param req
 */
export function login(req: components.LoginReq) {
	return webapi.post<components.LoginResp>(`/api/v1/user/login`, req)
}

/**
 * @description "用户注册"
 * @param req
 */
export function register(req: components.RegisterReq) {
	return webapi.post<components.RegisterResp>(`/api/v1/user/register`, req)
}

/**
 * @description "获取当前登录用户信息（受保护路由，强制由 JWT Claims 解析身份，杜绝水平越权）"
 */
export function getUserInfo() {
	return webapi.get<components.UserInfoResp>(`/api/v1/user/info`)
}
