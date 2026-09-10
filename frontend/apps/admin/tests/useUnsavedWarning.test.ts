import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnsavedWarning } from "../src/hooks/useUnsavedWarning";

describe("useUnsavedWarning Hook", () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not attach beforeunload event listener when isDirty is false", () => {
    renderHook(() => useUnsavedWarning(false));
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  it("attaches beforeunload listener when isDirty is true", () => {
    const { unmount } = renderHook(() => useUnsavedWarning(true));
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  it("triggers preventDefault and returns message on beforeunload event", () => {
    renderHook(() =>
      useUnsavedWarning(true, { message: "Custom warning message" })
    );

    const handler = addEventListenerSpy.mock.calls.find(
      (call: any[]) => call[0] === "beforeunload"
    )?.[1];
    expect(handler).toBeDefined();

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: "",
    } as any;

    const res = handler(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.returnValue).toBe("Custom warning message");
    expect(res).toBe("Custom warning message");
  });

  it("does not attach listener when enabled is explicitly false", () => {
    renderHook(() => useUnsavedWarning(true, { enabled: false }));
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });
});
