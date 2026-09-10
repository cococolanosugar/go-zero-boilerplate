import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  broadcastSessionEvent,
  addSessionSyncListener,
  SYNC_STORAGE_KEY,
} from "@zero/shared";

describe("sessionSync multi-tab communication", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("broadcasts session events to localStorage with timestamp", () => {
    broadcastSessionEvent("AUTH_LOGOUT", { reason: "user_triggered" });

    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.type).toBe("AUTH_LOGOUT");
    expect(parsed.data.reason).toBe("user_triggered");
    expect(parsed.timestamp).toBeGreaterThan(0);
  });

  it("triggers registered listener upon storage event reception", () => {
    const listener = vi.fn();
    const unsubscribe = addSessionSyncListener(listener);

    const testPayload = {
      type: "THEME_CHANGE" as const,
      timestamp: Date.now(),
      data: { isDark: true },
    };

    // 模拟来自 sibling tab 的 storage 事件
    const storageEvent = new StorageEvent("storage", {
      key: SYNC_STORAGE_KEY,
      newValue: JSON.stringify(testPayload),
    });
    window.dispatchEvent(storageEvent);

    expect(listener).toHaveBeenCalledWith(testPayload);

    unsubscribe();

    // 取消订阅后再触发不应收到
    window.dispatchEvent(storageEvent);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
