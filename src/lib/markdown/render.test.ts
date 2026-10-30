import { expect, it } from "vitest";

import { renderMarkdownToHtml } from "./render";

it("プレビュー用HTMLを同期的に返し、許可されていない画像URLを除く", () => {
  const html = renderMarkdownToHtml(
    "## 観察結果\n\n**根張り**を確認した。\n\n![許可画像](https://placehold.co/300x200)\n\n![外部画像](https://example.com/image.png)",
  );
  expect(html).toContain("<h2>観察結果</h2>");
  expect(html).toContain("<strong>根張り</strong>");
  expect(html).toContain('src="https://placehold.co/300x200"');
  expect(html).not.toContain("https://example.com/image.png");
});
