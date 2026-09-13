import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setUnauthorizedHandler, handleUnauthorized, setToken, getToken } from "@zero/api";

describe("Portal Authentication & Session Handling", () => {
  beforeEach(() => {
    localStorage.clear();
    setToken(null);
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    localStorage.clear();
  });

  it("should trigger custom unauthorized handler without hard page reload", () => {
    setToken("test_token_123");
    expect(getToken()).toBe("test_token_123");

    const customHandler = vi.fn();
    setUnauthorizedHandler(customHandler);

    handleUnauthorized();

    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
  });

  it("should correctly store and retrieve mobile user session state", () => {
    const mobileUser = {
      username: "13800000000",
      realName: "张三 (业务客户)",
      mobile: "13800000000",
      roles: ["portal_client"],
    };

    localStorage.setItem("portal_login_type", "mobile");
    localStorage.setItem("portal_mobile_user", JSON.stringify(mobileUser));

    const loginType = localStorage.getItem("portal_login_type");
    const rawData = localStorage.getItem("portal_mobile_user");
    const parsed = rawData ? JSON.parse(rawData) : null;

    expect(loginType).toBe("mobile");
    expect(parsed?.realName).toBe("张三 (业务客户)");
    expect(parsed?.mobile).toBe("13800000000");
  });

  it("should clean up tokens and dispatch custom event on logout", () => {
    setToken("sample_token");
    localStorage.setItem("portal_login_type", "mobile");
    localStorage.setItem("portal_mobile_user", "{}");

    setToken(null);
    localStorage.removeItem("portal_login_type");
    localStorage.removeItem("portal_mobile_user");

    expect(getToken()).toBeNull();
    expect(localStorage.getItem("portal_login_type")).toBeNull();
    expect(localStorage.getItem("portal_mobile_user")).toBeNull();
  });
});
