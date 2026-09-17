import webapi from "./gocliRequest"
import * as components from "./gatewayComponents"
export * from "./gatewayComponents"

/**
 * @description "获取系统大盘聚合信息（mr.Finish 内网并发拉取用户画像与任务统计）"
 * @param params
 */
export function getDashboardOverview(params: components.DashboardReqParams) {
	return webapi.get<components.DashboardResp>(`/api/v1/dashboard/overview`, params)
}

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
 * @description 
 * @param params
 */
export function listProcessDefs(params: components.ListProcessDefsReqParams) {
	return webapi.get<components.ListProcessDefsResp>(`/api/v1/itsm/process-defs`, params)
}

/**
 * @description 
 * @param req
 */
export function createProcessDef(req: components.CreateProcessDefReqVO) {
	return webapi.post<components.CreateTicketRespVO>(`/api/v1/itsm/process-defs`, req)
}

/**
 * @description 
 * @param params
 */
export function getProcessDef(params: components.GetProcessDefReqParams, id: number) {
	return webapi.get<components.ProcessDefVO>(`/api/v1/itsm/process-defs/${id}`, params)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function updateProcessDef(params: components.UpdateProcessDefReqVOParams, req: components.UpdateProcessDefReqVO, id: number) {
	return webapi.put<null>(`/api/v1/itsm/process-defs/${id}`, params, req)
}

/**
 * @description 
 * @param params
 */
export function deployProcessDef(params: components.DeployProcessDefReqVOParams, id: number) {
	return webapi.post<null>(`/api/v1/itsm/process-defs/${id}/deploy`, params)
}

/**
 * @description 
 */
export function listSlaPolicies() {
	return webapi.get<components.ListSlaPoliciesRespVO>(`/api/v1/itsm/sla-policies`)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function updateSlaPolicy(params: components.UpdateSlaPolicyReqVOParams, req: components.UpdateSlaPolicyReqVO, id: number) {
	return webapi.put<null>(`/api/v1/itsm/sla-policies/${id}`, params, req)
}

/**
 * @description 
 * @param params
 */
export function listTickets(params: components.ListTicketsReqVOParams) {
	return webapi.get<components.ListTicketsRespVO>(`/api/v1/itsm/tickets`, params)
}

/**
 * @description 
 * @param req
 */
export function createTicket(req: components.CreateTicketReqVO) {
	return webapi.post<components.CreateTicketRespVO>(`/api/v1/itsm/tickets`, req)
}

/**
 * @description 
 * @param params
 */
export function getTicketDetail(params: components.GetTicketDetailReqVOParams, id: number) {
	return webapi.get<components.TicketDetailRespVO>(`/api/v1/itsm/tickets/${id}`, params)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function approveTask(params: components.ApproveTaskReqVOParams, req: components.ApproveTaskReqVO, id: number) {
	return webapi.post<null>(`/api/v1/itsm/tickets/${id}/approve`, params, req)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function cancelTicket(params: components.CancelTicketReqVOParams, req: components.CancelTicketReqVO, id: number) {
	return webapi.post<null>(`/api/v1/itsm/tickets/${id}/cancel`, params, req)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function claimTask(params: components.ClaimTaskReqVOParams, req: components.ClaimTaskReqVO, id: number) {
	return webapi.post<null>(`/api/v1/itsm/tickets/${id}/claim`, params, req)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function rejectTask(params: components.RejectTaskReqVOParams, req: components.RejectTaskReqVO, id: number) {
	return webapi.post<null>(`/api/v1/itsm/tickets/${id}/reject`, params, req)
}

/**
 * @description 
 * @param params
 */
export function getTicketTrajectory(params: components.GetTicketTrajectoryReqVOParams, id: number) {
	return webapi.get<components.TicketTrajectoryRespVO>(`/api/v1/itsm/tickets/${id}/trajectory`, params)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function transferTask(params: components.TransferTaskReqVOParams, req: components.TransferTaskReqVO, id: number) {
	return webapi.post<null>(`/api/v1/itsm/tickets/${id}/transfer`, params, req)
}

/**
 * @description "获取门户公开网址导航列表"
 * @param params
 */
export function getPortalNavList(params: components.GetPortalNavListReqParams) {
	return webapi.get<components.GetPortalNavListResp>(`/api/v1/portal/navigation/list`, params)
}

/**
 * @description "获取参数配置表列表"
 * @param params
 */
export function listSysConfig(params: components.ListSysConfigReqParams) {
	return webapi.get<components.ListSysConfigResp>(`/api/v1/user/sys-config`, params)
}

/**
 * @description "创建参数配置表"
 * @param req
 */
export function createSysConfig(req: components.CreateSysConfigReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/user/sys-config`, req)
}

/**
 * @description "更新参数配置表"
 * @param req
 */
export function updateSysConfig(req: components.UpdateSysConfigReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/user/sys-config`, req)
}

/**
 * @description "获取参数配置表详情"
 * @param params
 */
export function getSysConfig(params: components.SysIdReqParams, id: number) {
	return webapi.get<components.SysConfigItem>(`/api/v1/user/sys-config/${id}`, params)
}

/**
 * @description "删除参数配置表"
 * @param params
 */
export function deleteSysConfig(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/user/sys-config/${id}`, params)
}

/**
 * @description "获取部门树形列表"
 * @param params
 */
export function listSysDept(params: components.ListSysDeptReqParams) {
	return webapi.get<components.ListSysDeptResp>(`/api/v1/user/dept`, params)
}

/**
 * @description "创建新部门"
 * @param req
 */
export function createSysDept(req: components.CreateSysDeptReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/user/dept`, req)
}

/**
 * @description "更新部门"
 * @param req
 */
export function updateSysDept(req: components.UpdateSysDeptReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/user/dept`, req)
}

/**
 * @description "获取部门详情"
 * @param params
 */
export function getSysDept(params: components.SysIdReqParams, id: number) {
	return webapi.get<components.SysDeptItem>(`/api/v1/user/dept/${id}`, params)
}

/**
 * @description "删除部门"
 * @param params
 */
export function deleteSysDept(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/user/dept/${id}`, params)
}

/**
 * @description "创建系统导航站点"
 * @param req
 */
export function createSysPortalNav(req: components.CreateSysPortalNavReq) {
	return webapi.post<components.CreateSysPortalNavResp>(`/api/v1/system/navigation`, req)
}

/**
 * @description "获取导航站点详情"
 * @param params
 */
export function getSysPortalNav(params: components.GetSysPortalNavReqParams, id: number) {
	return webapi.get<components.PortalNavDTO>(`/api/v1/system/navigation/${id}`, params)
}

/**
 * @description "更新系统导航站点"
 * @param params
 * @param req
 */
export function updateSysPortalNav(params: components.UpdateSysPortalNavReqParams, req: components.UpdateSysPortalNavReq, id: number) {
	return webapi.put<components.UpdateSysPortalNavResp>(`/api/v1/system/navigation/${id}`, params, req)
}

/**
 * @description "删除系统导航站点"
 * @param params
 */
export function deleteSysPortalNav(params: components.DeleteSysPortalNavReqParams, id: number) {
	return webapi.delete<components.DeleteSysPortalNavResp>(`/api/v1/system/navigation/${id}`, params)
}

/**
 * @description "分页查询系统导航配置列表"
 * @param params
 */
export function listSysPortalNav(params: components.ListSysPortalNavReqParams) {
	return webapi.get<components.ListSysPortalNavResp>(`/api/v1/system/navigation/list`, params)
}

/**
 * @description "获取通知公告表列表"
 * @param params
 */
export function listSysNotice(params: components.ListSysNoticeReqParams) {
	return webapi.get<components.ListSysNoticeResp>(`/api/v1/user/sys-notice`, params)
}

/**
 * @description "创建通知公告表"
 * @param req
 */
export function createSysNotice(req: components.CreateSysNoticeReq) {
	return webapi.post<components.SysIdResp>(`/api/v1/user/sys-notice`, req)
}

/**
 * @description "更新通知公告表"
 * @param req
 */
export function updateSysNotice(req: components.UpdateSysNoticeReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/user/sys-notice`, req)
}

/**
 * @description "获取通知公告表详情"
 * @param params
 */
export function getSysNotice(params: components.SysIdReqParams, id: number) {
	return webapi.get<components.SysNoticeItem>(`/api/v1/user/sys-notice/${id}`, params)
}

/**
 * @description "删除通知公告表"
 * @param params
 */
export function deleteSysNotice(params: components.SysIdReqParams, id: number) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/user/sys-notice/${id}`, params)
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
 * @description "通用文件上传"
 */
export function uploadFile() {
	return webapi.post<components.FileUploadResp>(`/api/v1/system/file/upload`)
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
 * @description "获取当前在线用户会话列表"
 * @param params
 */
export function listOnlineSessions(params: components.ListOnlineSessionsReqParams) {
	return webapi.get<components.ListOnlineSessionsResp>(`/api/v1/system/online`, params)
}

/**
 * @description "强退指定在线用户会话"
 * @param params
 */
export function forceLogoutOnlineSession(params: components.ForceLogoutReqParams, sessionId: string) {
	return webapi.delete<components.SysEmptyResp>(`/api/v1/system/online/${sessionId}`, params)
}

/**
 * @description "修改当前登录员工密码"
 * @param req
 */
export function changePersonalPassword(req: components.ChangePersonalPasswordReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/system/personal/password`, req)
}

/**
 * @description "获取当前登录员工画像与权限"
 */
export function getAdminProfile() {
	return webapi.get<components.AdminProfileResp>(`/api/v1/system/personal/profile`)
}

/**
 * @description "修改当前登录员工个人资料"
 * @param req
 */
export function updatePersonalProfile(req: components.UpdatePersonalProfileReq) {
	return webapi.put<components.SysEmptyResp>(`/api/v1/system/personal/profile`, req)
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
 * @description "获取异步任务分页列表"
 * @param params
 */
export function listTasks(params: components.ListTasksReqParams) {
	return webapi.get<components.ListTasksResp>(`/api/v1/system/task`, params)
}

/**
 * @description "新增异步任务"
 * @param req
 */
export function createTask(req: components.CreateTaskReq) {
	return webapi.post<components.AsyncTaskItem>(`/api/v1/system/task`, req)
}

/**
 * @description "获取异步任务详情"
 * @param params
 */
export function getTask(params: components.GetTaskReqParams, id: number) {
	return webapi.get<components.AsyncTaskItem>(`/api/v1/system/task/${id}`, params)
}

/**
 * @description "修改异步任务"
 * @param params
 * @param req
 */
export function updateTask(params: components.UpdateTaskReqParams, req: components.UpdateTaskReq, id: number) {
	return webapi.put<components.AsyncTaskItem>(`/api/v1/system/task/${id}`, params, req)
}

/**
 * @description "删除异步任务"
 * @param params
 */
export function deleteTask(params: components.DeleteTaskReqParams, id: number) {
	return webapi.delete<components.DeleteTaskResp>(`/api/v1/system/task/${id}`, params)
}

/**
 * @description "立即触发执行一次任务"
 * @param params
 */
export function runTaskOnce(params: components.RunTaskOnceReqParams, id: number) {
	return webapi.post<components.RunTaskOnceResp>(`/api/v1/system/task/${id}/run`, params)
}

/**
 * @description "启停异步任务"
 * @param params
 * @param req
 */
export function toggleTaskStatus(params: components.ToggleTaskStatusReqParams, req: components.ToggleTaskStatusReq, id: number) {
	return webapi.put<components.ToggleTaskStatusResp>(`/api/v1/system/task/${id}/status`, params, req)
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

/**
 * @description "获取统一用户个人画像（双表融合聚合，支持员工与客户）"
 */
export function getUserProfile() {
	return webapi.get<components.UserProfileResp>(`/api/v1/user/profile`)
}

/**
 * @description "获取当前员工个人通知流与未读数"
 * @param params
 */
export function getMyNoticeFeed(params: components.GetMyNoticeFeedReqParams) {
	return webapi.get<components.GetMyNoticeFeedResp>(`/api/v1/user/notice/my-list`, params)
}

/**
 * @description "标记单条通知已读"
 * @param req
 */
export function markNoticeRead(req: components.MarkNoticeReadReq) {
	return webapi.post<components.SysEmptyResp>(`/api/v1/user/notice/read`, req)
}

/**
 * @description "全部标记已读"
 * @param req
 */
export function markAllNoticesRead(req: components.MarkAllNoticesReadReq) {
	return webapi.post<components.SysEmptyResp>(`/api/v1/user/notice/read-all`, req)
}
