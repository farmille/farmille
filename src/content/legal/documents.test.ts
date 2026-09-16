import { describe, expect, it } from "vitest";
import { legalDocuments } from "./documents";
import { renderMarkdownToHtml } from "@/lib/markdown/render";

describe("規約集", () => {
  it("10種類の規約を重複しないURLで提供する", () => {
    expect(legalDocuments).toHaveLength(10);
    expect(new Set(legalDocuments.map((document) => document.slug)).size).toBe(10);
    for (const document of legalDocuments) {
      expect(document.title).toMatch(/^Farmille /);
      expect(document.sections.some((section) => section.heading)).toBe(true);
      expect(document.sections.at(-1)?.markdown).toContain("ファーミル株式会社");
    }
  });

  it("総合利用規約とメーカー会員規約の全20条を収録する", () => {
    for (const slug of ["terms", "manufacturer"]) {
      const document = legalDocuments.find((entry) => entry.slug === slug);
      expect(document?.sections.filter((section) => section.heading)).toHaveLength(20);
    }
  });

  it("本文にh1・h2を混在させず、安全なHTMLで全項目を表示する", async () => {
    for (const document of legalDocuments) {
      for (const section of document.sections) {
        const html = await renderMarkdownToHtml(section.markdown);
        expect(html).not.toMatch(/<(?:h1|h2|script|iframe)[ >]/);
        expect(html).not.toContain("javascript:");
      }
    }
  });

  it("第3条の入れ子の箇条書きを引用文にしない", async () => {
    const section = legalDocuments.find((document) => document.slug === "terms")?.sections[2];
    expect(section).toBeDefined();
    if (!section) throw new Error("第3条がありません");
    const html = await renderMarkdownToHtml(section.markdown);
    expect(html).toContain("<ol>");
    expect(html).toContain("<ul>");
    expect(html).not.toContain("<blockquote>");
  });
});
