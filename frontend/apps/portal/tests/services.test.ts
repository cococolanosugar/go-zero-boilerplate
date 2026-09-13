import { describe, it, expect } from "vitest";
import * as portalServices from "../src/services";

describe("Portal Service Boundary Integrity", () => {
  it("should export only customer-facing domain services and not admin management services", () => {
    // Should export portal domain services
    expect(portalServices.authService).toBeDefined();
    expect(portalServices.userService).toBeDefined();
    expect(portalServices.dashboardService).toBeDefined();
    expect(portalServices.toProTableRequest).toBeDefined();
    expect(portalServices.services).toBeDefined();

    // Administrative management clients MUST NOT be exported from portal services
    const exportedKeys = Object.keys(portalServices);
    expect(exportedKeys).not.toContain("systemUsersApi");
    expect(exportedKeys).not.toContain("systemRolesApi");
    expect(exportedKeys).not.toContain("systemMenusApi");
    expect(exportedKeys).not.toContain("systemApisApi");
    expect(exportedKeys).not.toContain("systemLogsApi");
    expect(exportedKeys).not.toContain("systemDictsApi");
  });

  it("should provide expected service methods on userService", () => {
    expect(typeof portalServices.userService.getUserProfile).toBe("function");
    expect(typeof portalServices.userService.getUserInfo).toBe("function");
  });
});
