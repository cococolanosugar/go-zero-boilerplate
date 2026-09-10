import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  LayoutSettingsProvider,
  useLayoutSettings,
  PRESET_THEME_COLORS,
} from "../src/contexts/LayoutSettingsContext";
import { STORAGE_KEYS } from "../src/constants";

describe("LayoutSettingsContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <LayoutSettingsProvider>{children}</LayoutSettingsProvider>
  );

  it("should provide 8 curated preset colors", () => {
    const { result } = renderHook(() => useLayoutSettings(), { wrapper });
    expect(result.current.presetColors.length).toBe(8);
    expect(PRESET_THEME_COLORS.some((c) => c.key === "green")).toBe(true);
    expect(PRESET_THEME_COLORS.some((c) => c.key === "purple")).toBe(true);
  });

  it("should dynamically switch primary color and persist to localStorage", () => {
    const { result } = renderHook(() => useLayoutSettings(), { wrapper });

    act(() => {
      result.current.setColorPrimary("#52c41a");
    });

    expect(result.current.settings.colorPrimary).toBe("#52c41a");

    const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_SETTINGS);
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved!);
    expect(parsed.colorPrimary).toBe("#52c41a");
  });

  it("should toggle nav theme between light and realDark", () => {
    const { result } = renderHook(() => useLayoutSettings(), { wrapper });
    expect(result.current.isDark).toBe(false);

    act(() => {
      result.current.toggleNavTheme();
    });
    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.toggleNavTheme();
    });
    expect(result.current.isDark).toBe(false);
  });

  it("should dynamically toggle watermark and compact mode and persist to localStorage", () => {
    const { result } = renderHook(() => useLayoutSettings(), { wrapper });

    act(() => {
      result.current.setWatermark(false);
      result.current.setCompact(true);
    });

    expect(result.current.settings.watermark).toBe(false);
    expect(result.current.settings.compact).toBe(true);

    const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_SETTINGS);
    const parsed = JSON.parse(saved!);
    expect(parsed.watermark).toBe(false);
    expect(parsed.compact).toBe(true);
  });
});
