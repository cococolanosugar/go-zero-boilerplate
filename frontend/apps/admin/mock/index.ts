import authMock from "./auth.mock";
import dashboardMock from "./dashboard.mock";
import systemMock from "./system.mock";
import ordersMock from "./orders.mock";

export const mockData = {
  ...authMock,
  ...dashboardMock,
  ...systemMock,
  ...ordersMock,
};

export { vitePluginMock } from "./mockPlugin";
export default mockData;
