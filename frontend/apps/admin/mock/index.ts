import authMock from "./auth.mock";
import dashboardMock from "./dashboard.mock";
import systemMock from "./system.mock";

export const mockData = {
  ...authMock,
  ...dashboardMock,
  ...systemMock,
};

export { vitePluginMock } from "./mockPlugin";
export default mockData;
