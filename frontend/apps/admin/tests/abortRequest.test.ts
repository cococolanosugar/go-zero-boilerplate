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
      expect(options.signal).toBeDefined();
      expect(options.signal.aborted).toBe(true);
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

  it("aborts with code -3 when request exceeds configured timeout", async () => {
    const errorHandlerMock = vi.fn();
    setErrorHandler(errorHandlerMock);

    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        if (options.signal) {
          options.signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted.");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    await expect(
      webapi.get("/api/v1/test/timeout", undefined, { timeout: 20 })
    ).rejects.toMatchObject({
      name: "ApiError",
      code: -3,
      handled: true,
      message: "请求超时，请检查网络",
    });

    expect(errorHandlerMock).toHaveBeenCalledTimes(1);
    expect(errorHandlerMock.mock.calls[0][0].code).toBe(-3);
  });
});
