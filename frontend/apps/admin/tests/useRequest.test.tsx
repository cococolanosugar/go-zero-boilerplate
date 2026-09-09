import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRequest } from "ahooks";

describe("ahooks useRequest Integration", () => {
  it("should manage async lifecycle and loading states correctly", async () => {
    const mockService = vi.fn().mockImplementation(async (name: string) => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { success: true, greeting: `Hello, ${name}` };
    });

    const { result } = renderHook(() =>
      useRequest(mockService, {
        manual: true,
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();

    // Trigger runAsync
    let runPromise: Promise<any>;
    act(() => {
      runPromise = result.current.runAsync("Ant Design Pro");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await runPromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ success: true, greeting: "Hello, Ant Design Pro" });
    expect(mockService).toHaveBeenCalledWith("Ant Design Pro");
  });

  it("should support debounceWait on rapid invocations", async () => {
    const mockService = vi.fn().mockResolvedValue("search results");

    const { result } = renderHook(() =>
      useRequest(mockService, {
        manual: true,
        debounceWait: 100,
      })
    );

    // Call 3 times rapidly
    act(() => {
      result.current.run("q1");
      result.current.run("q2");
      result.current.run("q3");
    });

    // Before debounce timer fires
    expect(mockService).not.toHaveBeenCalled();

    // Wait for debounce timer
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Should only be called ONCE with the last query
    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith("q3");
  });
});
