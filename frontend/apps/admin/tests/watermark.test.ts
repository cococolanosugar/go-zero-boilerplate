import { describe, it, expect, vi } from "vitest";
import { layout } from "../src/app";
import { defaultSettings } from "../src/config/defaultSettings";

describe("Enterprise Security Watermark System", () => {
  const createMockContext = (overrides?: any) => {
    return {
      initialState: {
        currentUser: {
          id: 1,
          username: "admin",
          realName: "超级管理员",
          roles: ["ROLE_ADMIN"],
          permissions: ["*"],
          menus: [],
        },
        permissions: ["*"],
        roles: ["ROLE_ADMIN"],
        menus: [],
        isSuperAdmin: true,
        loading: false,
        ...overrides?.initialState,
      },
      setInitialState: vi.fn(),
      navigate: vi.fn(),
      formatMessage: ({ defaultMessage }: any) => defaultMessage || "",
      message: {},
      settings: { ...defaultSettings, ...overrides?.settings },
      setSettings: vi.fn(),
      toggleNavTheme: vi.fn(),
      isDark: overrides?.isDark ?? false,
      locale: "zh-CN" as const,
      setLocale: vi.fn(),
      isFullscreen: false,
      toggleFullscreen: vi.fn(),
    };
  };

  it("produces multi-line security watermark content by default in light mode", () => {
    const ctx = createMockContext();
    const config = layout(ctx);

    expect(config.waterMarkProps).toBeDefined();
    const content = config.waterMarkProps?.content;
    expect(Array.isArray(content)).toBe(true);
    expect(content?.[0]).toContain("超级管理员 (@admin)");
    expect(content?.[1]).toContain("内部机密 严禁外传");
    expect(config.waterMarkProps?.font?.color).toBe("rgba(0, 0, 0, 0.07)");
  });

  it("adapts watermark font color for dark mode", () => {
    const ctx = createMockContext({ isDark: true });
    const config = layout(ctx);

    expect(config.waterMarkProps).toBeDefined();
    expect(config.waterMarkProps?.font?.color).toBe("rgba(255, 255, 255, 0.07)");
  });

  it("disables watermark when settings.watermark is false", () => {
    const ctx = createMockContext({
      settings: { watermark: false },
    });
    const config = layout(ctx);

    expect(config.waterMarkProps).toBeUndefined();
  });

  it("falls back to username or default when realName is empty", () => {
    const ctx = createMockContext({
      initialState: {
        currentUser: {
          id: 2,
          username: "operator01",
          realName: "",
        },
      },
    });
    const config = layout(ctx);

    const content = config.waterMarkProps?.content;
    expect(content?.[0]).toContain("operator01 (@operator01)");
  });
});
