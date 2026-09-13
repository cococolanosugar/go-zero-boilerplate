import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { OfflineGuard } from "../src/Root";
import { LocaleProvider } from "../src/contexts/LocaleContext";

describe("Portal OfflineGuard Component", () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("does not render alert banner when online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    render(
      <LocaleProvider>
        <AntdApp>
          <OfflineGuard />
        </AntdApp>
      </LocaleProvider>
    );

    expect(screen.queryByText(/当前网络连接已断开/)).toBeNull();
  });

  it("renders alert banner when offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    render(
      <LocaleProvider>
        <AntdApp>
          <OfflineGuard />
        </AntdApp>
      </LocaleProvider>
    );

    expect(screen.getByText(/当前网络连接已断开/)).toBeDefined();
  });

  it("dynamically shows and hides on offline/online events", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    render(
      <LocaleProvider>
        <AntdApp>
          <OfflineGuard />
        </AntdApp>
      </LocaleProvider>
    );

    expect(screen.queryByText(/当前网络连接已断开/)).toBeNull();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/当前网络连接已断开/)).toBeDefined();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByText(/当前网络连接已断开/)).toBeNull();
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <LocaleProvider>
        <AntdApp>
          <OfflineGuard />
        </AntdApp>
      </LocaleProvider>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
