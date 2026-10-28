import { describe, expect, it } from "vitest";

import {
  SELLER_EMAIL_DOMAIN,
  syntheticSellerEmail,
  validateSellerApply,
} from "@/server/accounts/seller";

describe("syntheticSellerEmail", () => {
  it("Farmille企業会員ID を固定ドメインの合成メールへ解決する", () => {
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

    {
      expect(syntheticSellerEmail("admin@evil.example")).toBeNull();
    }
  });
});

describe("validateSellerApply", () => {
  const valid = {
    officialName: "デモ株式会社",
    corporateNumber: "1234567890123",
    contactPhone: "090-1234-5678",
    materialRequestNotes: "",
    contactEmail: "contact@example.com",
    contactName: "担当 太郎",
    location: "東京都千代田区",
    websiteUrl: "https://example.com",
    inviteCode: "",
  };

  it("必須項目が揃えば通る", () => {
    const result = validateSellerApply(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.corporateNumber).toBe("1234567890123");
    expect(result.input.websiteUrl).toBe("https://example.com");
    expect(result.input.inviteCode).toBe("");
  });

  it("法人番号の形式エラーをフィールドに返す", () => {
    const result = validateSellerApply({ ...valid, corporateNumber: "AB", contactPhone: "" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.corporateNumber).toBeDefined();

    expect(result.fieldErrors.contactPhone).toBeDefined();
  });

  it("公式サイト URL は空を許可し、不正なスキームを弾く", () => {
    const empty = validateSellerApply({ ...valid, websiteUrl: "" });
    expect(empty.ok).toBe(true);
    if (empty.ok) expect(empty.input.websiteUrl).toBe("");

    const bad = validateSellerApply({ ...valid, websiteUrl: "ftp://example.com" });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.fieldErrors.websiteUrl).toBeDefined();
  });
});
