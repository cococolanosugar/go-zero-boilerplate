import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAdminPortalUrl } from "../src/utils/env";

describe("Portal Environment Utilities", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      protocol: "http:",
      hostname: "192.168.31.174",
      port: "3000",
    } as any;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("should dynamically resolve admin URL matching current hostname with port 3001", () => {
    const url = getAdminPortalUrl();
    expect(url).toBe("http://192.168.31.174:3001");
  });

  it("should resolve localhost correctly when running locally", () => {
    window.location = {
      ...originalLocation,
      protocol: "http:",
      hostname: "localhost",
      port: "3000",
    } as any;

    const url = getAdminPortalUrl();
    expect(url).toBe("http://localhost:3001");
  });
});
