import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  maskPhone,
  maskEmail,
  maskIdCard,
  copyToClipboard,
  debounce,
  throttle,
  exportCsv,
  exportToCsv,
} from "@zero/shared";

describe("Sensitive Data Masking", () => {
  describe("maskPhone", () => {
    it("masks standard 11-digit mobile number", () => {
      expect(maskPhone("13812345678")).toBe("138****5678");
    });

    it("supports custom mask character", () => {
      expect(maskPhone("13812345678", { maskChar: "#" })).toBe("138####5678");
    });

    it("supports custom head and tail", () => {
      expect(maskPhone("13812345678", { head: 4, tail: 3 })).toBe("1381****678");
    });

    it("handles short numbers gracefully", () => {
      expect(maskPhone("12345")).toBe("12345");
    });

    it("handles empty or null values", () => {
      expect(maskPhone("")).toBe("");
      expect(maskPhone(null)).toBe("");
      expect(maskPhone(undefined)).toBe("");
    });
  });

  describe("maskEmail", () => {
    it("masks standard email", () => {
      expect(maskEmail("alice@example.com")).toBe("a***e@example.com");
    });

    it("masks short username email", () => {
      expect(maskEmail("ab@example.com")).toBe("a***@example.com");
    });

    it("handles invalid email without @", () => {
      expect(maskEmail("notanemail")).toBe("notanemail");
    });

    it("handles empty or null values", () => {
      expect(maskEmail("")).toBe("");
      expect(maskEmail(null)).toBe("");
      expect(maskEmail(undefined)).toBe("");
    });
  });

  describe("maskIdCard", () => {
    it("masks 18-digit ID card", () => {
      expect(maskIdCard("110101199003072345")).toBe("110101********2345");
    });

    it("handles short values gracefully", () => {
      expect(maskIdCard("123456789")).toBe("123456789");
    });

    it("handles empty or null values", () => {
      expect(maskIdCard("")).toBe("");
      expect(maskIdCard(null)).toBe("");
      expect(maskIdCard(undefined)).toBe("");
    });
  });
});

describe("Shared Browser Utilities", () => {
  describe("copyToClipboard", () => {
    it("copies text using navigator.clipboard when available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const res = await copyToClipboard("hello world");
      expect(res).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("hello world");
    });

    it("falls back to execCommand when clipboard API throws", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
      });
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const res = await copyToClipboard("fallback text");
      expect(res).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("debounces consecutive calls", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200);

      debounced(1);
      debounced(2);
      debounced(3);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });

    it("cancels pending execution", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200);

      debounced(1);
      debounced.cancel();

      vi.advanceTimersByTime(250);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("throttles rapid calls", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 200);

      throttled(1); // executes immediately
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(1);

      throttled(2); // queued
      throttled(3); // queued, overwrites 2

      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith(3);
    });

    it("cancels scheduled call", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 200);

      throttled(1);
      throttled(2);
      throttled.cancel();

      vi.advanceTimersByTime(250);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("exportCsv alias", () => {
    it("is identical to exportToCsv", () => {
      expect(exportCsv).toBe(exportToCsv);
    });
  });
});
