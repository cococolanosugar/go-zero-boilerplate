import { describe, it, expect } from "vitest";
import { getAccess } from "../src/access";
import type { UserProfileResp } from "@zero/api";

describe("Portal Access Control", () => {
  it("should recognize super admin via roles and grant all permissions", () => {
    const profile: UserProfileResp = {
      userId: 1,
      username: "super_portal_admin",
      realName: "Portal Super",
      mobile: "13800000001",
      email: "portal@example.com",
      avatar: "",
      deptName: "Operations",
      userType: "employee",
      roles: ["ROLE_ADMIN"],
    };

    const access = getAccess(profile);
    expect(access.canAdmin).toBe(true);
    expect(access.canAccess("portal:service:benchmark")).toBe(true);
  });

  it("should NOT grant super admin solely based on userId without admin role", () => {
    const customerProfile: UserProfileResp = {
      userId: 1, // Same ID as superadmin in user table, but is customer
      username: "customer_user",
      realName: "Customer User",
      mobile: "13900000001",
      email: "",
      avatar: "",
      deptName: "业务客户",
      userType: "customer",
      roles: ["ROLE_USER"],
    };

    const access = getAccess(customerProfile);
    expect(access.canAdmin).toBe(false);
    expect(access.canAccess("portal:admin:only")).toBe(false);
  });

  it("should correctly handle unauthenticated visitors", () => {
    const access = getAccess(null);
    expect(access.canAdmin).toBe(false);
    expect(access.canAccess()).toBe(true); // Public routes allowed
    expect(access.canAccess("portal:protected:action")).toBe(false);
  });
});
