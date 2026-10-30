import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { describe, expect, it } from "vitest";
import { legalDocuments } from "./documents";

describe("規約集", () => {
  it("規約を重複しないURLで提供する", () => {
    expect(new Set(legalDocuments.map((document) => document.slug)).size).toBe(
      legalDocuments.length,
    );
  });

  it("本文にh1・h2や引用文を混在させず全項目を表示する", () => {
    for (const document of legalDocuments) {
      for (const section of document.sections) {
        const html = renderMarkdownToHtml(section.markdown);
        expect(html).not.toMatch(/<(?:h1|h2|blockquote|pre)[ >]/);
      }
    }
  });
});
