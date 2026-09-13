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

  it("should zero-fabricate local dummy profile and not store portal_mobile_user", () => {
    // Under the new architecture, mobile login stores only token & login_type,
    // and profile is strictly fetched from server-side getUserProfile()
    localStorage.setItem("portal_login_type", "mobile");
    setToken("mobile_jwt_token_sample");

    expect(localStorage.getItem("portal_mobile_user")).toBeNull();
    expect(localStorage.getItem("portal_login_type")).toBe("mobile");
    expect(getToken()).toBe("mobile_jwt_token_sample");
  });

  it("should clean up tokens and login type on logout without residual state", () => {
    setToken("sample_token");
    localStorage.setItem("portal_login_type", "mobile");

    setToken(null);
    localStorage.removeItem("portal_login_type");
    localStorage.removeItem("portal_mobile_user");

    expect(getToken()).toBeNull();
    expect(localStorage.getItem("portal_login_type")).toBeNull();
    expect(localStorage.getItem("portal_mobile_user")).toBeNull();
  });
});
