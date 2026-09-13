import {
  getDashboardOverview,
  type DashboardReqParams,
  type DashboardResp,
} from "../gateway";

export const dashboardService = {
  getOverview: (params: DashboardReqParams = {}) => getDashboardOverview(params),
};

export default dashboardService;
