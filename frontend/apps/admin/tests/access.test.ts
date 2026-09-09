import { describe, it, expect } from "vitest";
import { getAccess } from "../src/access";
import type { AdminProfileResp } from "@zero/api";

describe("Admin Access Control (RBAC Engine)", () => {
  it("should grant all permissions when user is super admin by ID 1", () => {
    const profile: AdminProfileResp = {
      id: 1,
      username: "superadmin",
      realName: "Super Admin",
      mobile: "13800000000",
      email: "admin@example.com",
      avatar: "",
      deptName: "IT",
      roles: ["editor"],
      permissions: [],
      menus: [],
    };

    const access = getAccess(profile);
    expect(access.canAdmin).toBe(true);
    expect(access.canAccess("any:arbitrary:code")).toBe(true);
    expect(access.canAccess(["sys:user:delete", "sys:role:create"])).toBe(true);
  });

  it("should grant all permissions when user has ROLE_ADMIN role", () => {
    const profile: AdminProfileResp = {
      id: 99,
      username: "admin_user",
      realName: "System Admin",
      mobile: "13900000000",
      email: "sysadmin@example.com",
      avatar: "",
      deptName: "Ops",
      roles: ["ROLE_ADMIN"],
      permissions: [],
      menus: [],
    };

    const access = getAccess(profile);
    expect(access.canAdmin).toBe(true);
    expect(access.canAccess("arbitrary:perm")).toBe(true);
  });

  it("should strictly check fine-grained permission codes for regular staff", () => {
    const profile: AdminProfileResp = {
      id: 10,
      username: "zhangsan",
      realName: "张三",
      mobile: "13700000000",
      email: "zhangsan@example.com",
      avatar: "",
      deptName: "销售部",
      roles: ["EMPLOYEE"],
      permissions: ["sys:order:list", "sys:order:export"],
      menus: [],
    };

    const access = getAccess(profile);
    expect(access.canAdmin).toBe(false);
    expect(access.canAccess("sys:order:list")).toBe(true);
    expect(access.canAccess("sys:order:export")).toBe(true);
    expect(access.canAccess("sys:order:delete")).toBe(false);

    // Array permission: should pass if ANY code matches
    expect(access.canAccess(["sys:order:delete", "sys:order:list"])).toBe(true);
    expect(access.canAccess(["sys:user:create", "sys:user:delete"])).toBe(false);
  });

  it("should handle empty or undefined profile safely", () => {
    const access = getAccess(null);
    expect(access.canAdmin).toBe(false);
    expect(access.canAccess()).toBe(true); // Public actions without access code
    expect(access.canAccess("sys:user:list")).toBe(false);
  });
});
