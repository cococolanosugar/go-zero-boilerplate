import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { webapi, setErrorHandler, ApiError } from "@zero/api";

describe("Request AbortController resilience", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setErrorHandler(null);
  });

  it("passes AbortSignal to fetch and gracefully handles AbortError without firing globalErrorHandler", async () => {
    const errorHandlerMock = vi.fn();
    setErrorHandler(errorHandlerMock);

    const controller = new AbortController();

    global.fetch = vi.fn().mockImplementation((_url, options) => {
      expect(options.signal).toBe(controller.signal);
      const abortErr = new Error("The user aborted a request.");
      abortErr.name = "AbortError";
      return Promise.reject(abortErr);
    });

    controller.abort();

    await expect(
      webapi.get("/api/v1/test/abortable", undefined, { signal: controller.signal })
    ).rejects.toMatchObject({
      name: "ApiError",
      code: -2,
      handled: true,
      message: "请求已主动取消",
    });

    expect(errorHandlerMock).not.toHaveBeenCalled();
  });
});
