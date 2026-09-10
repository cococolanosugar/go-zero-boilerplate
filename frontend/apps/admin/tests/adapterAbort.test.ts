import { describe, it, expect, vi } from "vitest";
import { toProTableRequest } from "@zero/api";

describe("toProTableRequest anti-race autoAbort", () => {
  it("automatically aborts preceding in-flight request when a new request is triggered", async () => {
    let callCount = 0;
    const signals: AbortSignal[] = [];

    const mockApi = vi.fn().mockImplementation((params, config) => {
      callCount++;
      if (config?.signal) {
        signals.push(config.signal);
      }
      return new Promise((resolve, reject) => {
        if (config?.signal) {
          config.signal.addEventListener("abort", () => {
            const err = new Error("The user aborted a request.");
            err.name = "AbortError";
            reject(err);
          });
        }
        setTimeout(() => {
          resolve({ list: [{ id: params.page }], total: 10 });
        }, 50);
      });
    });

    const requestFn = toProTableRequest(mockApi);

    // 发起第 1 次请求（page: 1）
    const p1 = requestFn({ current: 1, pageSize: 10 });

    // 立即发起第 2 次请求（page: 2）
    const p2 = requestFn({ current: 2, pageSize: 10 });

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(callCount).toBe(2);
    // 第 1 个请求的 signal 应该已被触发 abort
    expect(signals[0].aborted).toBe(true);
    // 第 1 个请求被捕获并返回非破坏性的 empty/failure 状态
    expect(res1.success).toBe(false);

    // 第 2 个请求正常成功返回
    expect(signals[1].aborted).toBe(false);
    expect(res2.success).toBe(true);
    expect(res2.data[0].id).toBe(2);
  });
});
