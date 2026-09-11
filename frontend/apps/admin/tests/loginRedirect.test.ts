import { describe, it, expect } from "vitest";

export function resolveLoginRedirect(
  location: { search: string; state?: any },
  fallback = "/dashboard"
): string {
  const searchParams = new URLSearchParams(location.search);
  const queryFrom = searchParams.get("from");
  const stateFrom = location.state?.from;
  const statePath = typeof stateFrom === "string"
    ? stateFrom
    : stateFrom?.pathname
      ? `${stateFrom.pathname}${stateFrom.search || ""}`
      : undefined;

  return statePath || queryFrom || fallback;
}

describe("resolveLoginRedirect", () => {
  it("defaults to /dashboard when no redirect target is provided", () => {
    expect(resolveLoginRedirect({ search: "" })).toBe("/dashboard");
    expect(resolveLoginRedirect({ search: "", state: {} })).toBe("/dashboard");
  });

  it("extracts from query parameters correctly", () => {
    expect(resolveLoginRedirect({ search: "?from=%2Fsystem%2Fusers" })).toBe("/system/users");
    expect(resolveLoginRedirect({ search: "?from=/order/list?status=PAID" })).toBe("/order/list?status=PAID");
  });

  it("prioritizes router state from location if present", () => {
    expect(
      resolveLoginRedirect({
        search: "?from=/fallback",
        state: { from: { pathname: "/system/roles", search: "?pageSize=20" } },
      })
    ).toBe("/system/roles?pageSize=20");
  });

  it("handles state.from as string path", () => {
    expect(
      resolveLoginRedirect({
        search: "",
        state: { from: "/account/settings" },
      })
    ).toBe("/account/settings");
  });
});
