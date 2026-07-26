import { describe, expect, it } from "vitest";

import { SELLER_EMAIL_DOMAIN, syntheticSellerEmail } from "@/server/accounts/seller";

describe("syntheticSellerEmail", () => {
  it("ログイン ID を固定ドメインの合成メールへ解決する", () => {
    expect(syntheticSellerEmail("example-agri")).toBe(`example-agri@${SELLER_EMAIL_DOMAIN}`);
    expect(SELLER_EMAIL_DOMAIN).toBe("sellers.farmille.internal");
  });

  it("前後の空白と大文字を正規化する", () => {
    expect(syntheticSellerEmail("  Example.Agri  ")).toBe(`example.agri@${SELLER_EMAIL_DOMAIN}`);
  });

  it("login_id の CHECK 制約に合わない値は解決しない", () => {
    expect(syntheticSellerEmail("ab")).toBeNull();
    expect(syntheticSellerEmail("-abc")).toBeNull();
    expect(syntheticSellerEmail("abc def")).toBeNull();
    expect(syntheticSellerEmail("abc@def")).toBeNull();
    expect(syntheticSellerEmail("あぐり商事")).toBeNull();
    expect(syntheticSellerEmail("a".repeat(32))).toBeNull();
    expect(syntheticSellerEmail("")).toBeNull();
  });

  it("メール形式の入力でドメインを差し替えられない", () => {
    expect(syntheticSellerEmail("admin@evil.example")).toBeNull();
  });
});
