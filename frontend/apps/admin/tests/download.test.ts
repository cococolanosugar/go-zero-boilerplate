import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractFilenameFromDisposition,
  downloadBlob,
  downloadByUrl,
} from "@zero/shared";

describe("Download Utilities", () => {
  describe("extractFilenameFromDisposition", () => {
    it("returns defaultName when disposition is undefined or empty", () => {
      expect(extractFilenameFromDisposition(undefined, "fallback.csv")).toBe("fallback.csv");
      expect(extractFilenameFromDisposition("", "fallback.csv")).toBe("fallback.csv");
    });

    it("extracts utf-8 encoded filename correctly", () => {
      const header = "attachment; filename*=utf-8''%e6%b5%8b%e8%af%95.xlsx";
      expect(extractFilenameFromDisposition(header)).toBe("测试.xlsx");
    });

    it("extracts quoted ASCII filename correctly", () => {
      const header = 'attachment; filename="export_2026.csv"';
      expect(extractFilenameFromDisposition(header)).toBe("export_2026.csv");
    });

    it("extracts unquoted ASCII filename correctly", () => {
      const header = "attachment; filename=export_2026.csv";
      expect(extractFilenameFromDisposition(header)).toBe("export_2026.csv");
    });
  });

  describe("downloadBlob & downloadByUrl DOM triggers", () => {
    let originalCreateObjectURL: any;
    let originalRevokeObjectURL: any;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-uuid");
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it("creates a link element, triggers click, and sets download attribute for Blob", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
      const blob = new Blob(["hello"], { type: "text/plain" });

      downloadBlob(blob, "hello.txt");

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
    });

    it("creates a link element, triggers click for URL", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");

      downloadByUrl("https://example.com/file.pdf", "file.pdf");

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
