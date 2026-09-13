import {
  authService,
  userService,
  dashboardService,
  toProTableRequest,
} from "@zero/api";

export {
  authService,
  userService,
  dashboardService,
  toProTableRequest,
};

export const services = {
  auth: authService,
  user: userService,
  dashboard: dashboardService,
};

export default services;