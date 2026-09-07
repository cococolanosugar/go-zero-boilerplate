import {
  getDashboardOverview,
  type DashboardReqParams,
  type DashboardResp,
} from "../gateway";

export const dashboardService = {
  getOverview: getDashboardOverview,
};

export default dashboardService;
