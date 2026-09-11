import { describe, it, expect } from "vitest";

interface TabItem {
  key: string;
  label: string;
  closable: boolean;
}

function closeRightTabs(tabs: TabItem[], currentPath: string): TabItem[] {
  const currentIndex = tabs.findIndex((t) => t.key === currentPath);
  if (currentIndex === -1 || currentIndex >= tabs.length - 1) return tabs;
  return tabs.slice(0, currentIndex + 1);
}

function removeTab(tabs: TabItem[], targetKey: string, homePath = "/dashboard"): TabItem[] {
  if (targetKey === homePath) return tabs;
  return tabs.filter((t) => t.key !== targetKey);
}

describe("MultiTabs pure logic", () => {
  const initialTabs: TabItem[] = [
    { key: "/dashboard", label: "仪表盘", closable: false },
    { key: "/system/users", label: "员工管理", closable: true },
    { key: "/system/roles", label: "角色管理", closable: true },
    { key: "/system/logs", label: "审计日志", closable: true },
  ];

  it("closes all tabs to the right of the active tab", () => {
    const result = closeRightTabs(initialTabs, "/system/users");
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.key)).toEqual(["/dashboard", "/system/users"]);
  });

  it("does not remove any tab if active tab is already the rightmost tab", () => {
    const result = closeRightTabs(initialTabs, "/system/logs");
    expect(result).toHaveLength(4);
  });

  it("does not remove unclosable home tab", () => {
    const result = removeTab(initialTabs, "/dashboard");
    expect(result).toHaveLength(4);
  });

  it("removes target tab by key", () => {
    const result = removeTab(initialTabs, "/system/roles");
    expect(result.map((t) => t.key)).toEqual([
      "/dashboard",
      "/system/users",
      "/system/logs",
    ]);
  });
});
