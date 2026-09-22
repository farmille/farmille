import { describe, expect, it } from "vitest";
import { uniqueMaterialLinks } from "./material-links";
import type { MaterialPageContent } from "./material-page-editor";

describe("uniqueMaterialLinks", () => {
  it("同一URLの最初の資料名を残し、技術・安全・概要の順で分類する", () => {
    const links: MaterialPageContent["links"] = [
      { trial: null, group: "overview", title: "最初の資料名", url: " https://example.com/a.pdf " },
      { trial: null, group: "safety", title: "安全資料", url: "https://example.com/a.pdf" },
      { trial: null, group: "technical", title: "技術資料", url: "https://example.com/a.pdf" },
      { trial: null, group: "overview", title: "別の資料", url: "https://example.com/b.pdf" },
    ];
    expect(uniqueMaterialLinks(links)).toEqual([
      { trial: null, group: "technical", title: "最初の資料名", url: "https://example.com/a.pdf" },
      { trial: null, group: "overview", title: "別の資料", url: "https://example.com/b.pdf" },
    ]);
    expect(links[0].group).toBe("overview");
  });
  it("編集途中のURL未入力行は消さない", () => {
    const links: MaterialPageContent["links"] = [
      { trial: null, group: "overview", title: "入力中1", url: "" },
      { trial: null, group: "safety", title: "入力中2", url: "" },
    ];
    expect(uniqueMaterialLinks(links)).toEqual(links);
  });
});
