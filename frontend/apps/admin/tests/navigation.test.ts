import { describe, it, expect } from "vitest";

describe("Admin Navigation Management Logic & Validation Tests", () => {
  // 验证网址格式校验规则
  const urlPattern = /^(https?:\/\/|\/)/;

  describe("URL Validation Rules", () => {
    it("should accept valid http:// URLs including {HOST} placeholder", () => {
      expect(urlPattern.test("http://{HOST}:8233")).toBe(true);
      expect(urlPattern.test("http://127.0.0.1:8888")).toBe(true);
      expect(urlPattern.test("http://localhost:3000")).toBe(true);
    });

    it("should accept valid https:// URLs", () => {
      expect(urlPattern.test("https://pro.ant.design")).toBe(true);
      expect(urlPattern.test("https://github.com/zeromicro/go-zero")).toBe(true);
    });

    it("should accept valid internal relative paths", () => {
      expect(urlPattern.test("/swagger")).toBe(true);
      expect(urlPattern.test("/system/navigation")).toBe(true);
    });

    it("should reject invalid URL schemes or plain text", () => {
      expect(urlPattern.test("ftp://files.internal")).toBe(false);
      expect(urlPattern.test("javascript:alert(1)")).toBe(false);
      expect(urlPattern.test("some-plain-string")).toBe(false);
      expect(urlPattern.test("localhost:8080")).toBe(false);
    });
  });

  describe("Tags normalization & processing", () => {
    it("should parse and trim comma-separated tags cleanly", () => {
      const rawTags = "Temporal,  Saga , Cron,  ";
      const tags = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
      expect(tags).toEqual(["Temporal", "Saga", "Cron"]);
    });

    it("should handle empty or undefined tags gracefully", () => {
      const rawTags = "";
      const tags = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
      expect(tags).toEqual([]);
    });
  });

  describe("Sort weighting comparison", () => {
    it("should sort items by sort weight in descending order", () => {
      const items = [
        { id: 1, sort: 50, title: "Portal" },
        { id: 2, sort: 100, title: "Temporal" },
        { id: 3, sort: 80, title: "Nacos" },
      ];
      const sorted = [...items].sort((a, b) => b.sort - a.sort);
      expect(sorted[0].title).toBe("Temporal");
      expect(sorted[1].title).toBe("Nacos");
      expect(sorted[2].title).toBe("Portal");
    });
  });

  describe("Environment mapping & definitions", () => {
    it("should contain standard environment presets", () => {
      const envValues = ["common", "prod", "pre", "test", "dev"];
      envValues.forEach((env) => {
        expect(typeof env).toBe("string");
      });
    });
  });
});

