import { describe, it, expect } from "vitest";
import {
  TECH_DOCS_DATA,
  getAllChapters,
  findChapterById,
  getAdjacentChapters,
} from "../src/pages/TechDocs/docsData";

describe("TechDocs Knowledge Base & Model Integrity Tests", () => {
  it("should contain 5 major documentation categories", () => {
    expect(TECH_DOCS_DATA.length).toBe(5);

    const categoryIds = TECH_DOCS_DATA.map((c) => c.id);
    expect(categoryIds).toContain("getting-started");
    expect(categoryIds).toContain("architecture");
    expect(categoryIds).toContain("governance");
    expect(categoryIds).toContain("workflows");
    expect(categoryIds).toContain("adr");

    TECH_DOCS_DATA.forEach((cat) => {
      expect(cat.id).toBeTruthy();
      expect(cat.title).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(cat.chapters.length).toBeGreaterThan(0);
    });
  });

  it("should contain at least 10 in-depth chapters with complete metadata", () => {
    const allChapters = getAllChapters();
    expect(allChapters.length).toBeGreaterThanOrEqual(10);

    const chapterIds = new Set<string>();

    allChapters.forEach((ch) => {
      // Ensure unique chapter IDs
      expect(chapterIds.has(ch.id)).toBe(false);
      chapterIds.add(ch.id);

      expect(ch.id).toBeTruthy();
      expect(ch.categoryId).toBeTruthy();
      expect(ch.title).toBeTruthy();
      expect(ch.readTime).toMatch(/^[0-9]+\s*min$/);
      expect(ch.summary).toBeTruthy();
      expect(ch.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(ch.headings.length).toBeGreaterThan(0);
      expect(ch.sections.length).toBeGreaterThan(0);

      // Verify headings
      ch.headings.forEach((h) => {
        expect(h.id).toBeTruthy();
        expect(h.text).toBeTruthy();
        expect([2, 3]).toContain(h.level);
      });

      // Verify sections have at least one content element
      ch.sections.forEach((sec) => {
        const hasContent =
          !!sec.heading ||
          (sec.paragraphs && sec.paragraphs.length > 0) ||
          !!sec.callout ||
          !!sec.codeBlock ||
          (sec.list && sec.list.length > 0);
        expect(hasContent).toBe(true);

        if (sec.codeBlock) {
          expect(sec.codeBlock.language).toBeTruthy();
          expect(sec.codeBlock.code).toBeTruthy();
        }

        if (sec.callout) {
          expect(["note", "tip", "warning", "important"]).toContain(sec.callout.type);
          expect(sec.callout.text).toBeTruthy();
        }
      });
    });
  });

  it("should have correct ADR decision records in adr category", () => {
    const adrCategory = TECH_DOCS_DATA.find((c) => c.id === "adr");
    expect(adrCategory).toBeDefined();

    const adrChapterIds = adrCategory!.chapters.map((ch) => ch.id);
    expect(adrChapterIds).toContain("adr-001");
    expect(adrChapterIds).toContain("adr-002");
    expect(adrChapterIds).toContain("adr-003");
  });

  it("should correctly find chapters by id and fallback gracefully", () => {
    const quickStart = findChapterById("quick-start");
    expect(quickStart).toBeDefined();
    expect(quickStart.id).toBe("quick-start");
    expect(quickStart.title).toBe("5 分钟本地开发起步指南");

    // Non-existent ID should fallback to the first chapter
    const fallback = findChapterById("non-existent-unknown-chapter");
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(getAllChapters()[0].id);
  });

  it("should accurately compute previous and next adjacent chapters", () => {
    const all = getAllChapters();
    const first = all[0];
    const second = all[1];
    const last = all[all.length - 1];

    // First chapter boundary
    const firstAdjacent = getAdjacentChapters(first.id);
    expect(firstAdjacent.prev).toBeNull();
    expect(firstAdjacent.next?.id).toBe(second.id);

    // Last chapter boundary
    const lastAdjacent = getAdjacentChapters(last.id);
    expect(lastAdjacent.prev?.id).toBe(all[all.length - 2].id);
    expect(lastAdjacent.next).toBeNull();

    // Intermediate chapter
    const secondAdjacent = getAdjacentChapters(second.id);
    expect(secondAdjacent.prev?.id).toBe(first.id);
    expect(secondAdjacent.next?.id).toBe(all[2].id);
  });

  it("should correctly support keyword search filtering", () => {
    const all = getAllChapters();

    // Search for "Temporal"
    const temporalMatches = all.filter(
      (ch) =>
        ch.title.toLowerCase().includes("temporal") ||
        ch.summary.toLowerCase().includes("temporal") ||
        ch.headings.some((h) => h.text.toLowerCase().includes("temporal"))
    );
    expect(temporalMatches.length).toBeGreaterThanOrEqual(2);

    // Search for "RBAC"
    const rbacMatches = all.filter(
      (ch) =>
        ch.title.toLowerCase().includes("rbac") ||
        ch.summary.toLowerCase().includes("rbac") ||
        ch.headings.some((h) => h.text.toLowerCase().includes("rbac"))
    );
    expect(rbacMatches.length).toBeGreaterThanOrEqual(1);

    // Search for "Casdoor"
    const casdoorMatches = all.filter(
      (ch) =>
        ch.title.toLowerCase().includes("casdoor") ||
        ch.summary.toLowerCase().includes("casdoor") ||
        ch.headings.some((h) => h.text.toLowerCase().includes("casdoor"))
    );
    expect(casdoorMatches.length).toBeGreaterThanOrEqual(1);
  });
});
