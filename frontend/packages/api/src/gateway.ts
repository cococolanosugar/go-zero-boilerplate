import webapi from "./gocliRequest"
import * as components from "./gatewayComponents"
export * from "./gatewayComponents"

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
 * @description "获取当前登录用户信息（受保护路由，强制由 JWT 解析身份，杜绝水平越权）"
 * @param params
 */
export function getUserInfo(params?: components.UserInfoReqParams) {
	return webapi.get<components.UserInfoResp>(`/api/v1/user/info`, params || {})
}
