import { describe, expect, it } from "vitest";

import { normalizeTotpQrCodeSource } from "@/server/admin/mfa-qr";

describe("normalizeTotpQrCodeSource", () => {
  it("末尾の空白・改行・タブだけを除去し、SVG内部の改行は保持する", () => {
    const source =
      'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg">\n<path d="M0 0h1v1H0z" />\n</svg>\r\n\t ';

    expect(normalizeTotpQrCodeSource(source)).toBe(
      'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg">\n<path d="M0 0h1v1H0z" />\n</svg>',
    );
  });

  it("末尾に空白がないSVG data URIは変更しない", () => {
    const source = "data:image/svg+xml,<svg></svg>";

    expect(normalizeTotpQrCodeSource(source)).toBe(source);
  });

  it.each(["", "data:image/png;base64,AAAA"])("SVG data URI以外は拒否する：%s", (source) => {
    expect(normalizeTotpQrCodeSource(source)).toBeNull();
  });
});
