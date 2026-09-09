import { describe, it, expect } from "vitest";
import { getAccess } from "../src/access";
import type { AdminProfileResp } from "@zero/api";

describe("Portal Access Control", () => {
  it("should recognize super admin and grant all permissions", () => {
    const profile: AdminProfileResp = {
      id: 1,
      username: "super_portal_admin",
      realName: "Portal Super",
      mobile: "13800000001",
      email: "portal@example.com",
      avatar: "",
      deptName: "Operations",
      roles: ["admin"],
      permissions: [],
      menus: [],
    };

    const access = getAccess(profile);
    expect(access.canAdmin).toBe(true);
    expect(access.canAccess("portal:service:benchmark")).toBe(true);
  });

  it("should correctly handle unauthenticated visitors", () => {
    const access = getAccess(null);
    expect(access.canAdmin).toBe(false);
    expect(access.canAccess()).toBe(true); // Public routes allowed
    expect(access.canAccess("portal:protected:action")).toBe(false);
  });
});
