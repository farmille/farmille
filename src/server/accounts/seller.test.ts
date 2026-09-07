import { describe, expect, it } from "vitest";

import {
  LOGIN_ID_PATTERN,
  SELLER_EMAIL_DOMAIN,
  syntheticSellerEmail,
  validateSellerApply,
} from "@/server/accounts/seller";

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

describe("LOGIN_ID_PATTERN", () => {
  it("合成メールのローカル部として使える形だけを許可する", () => {
    expect(LOGIN_ID_PATTERN.test("abc")).toBe(true);
    expect(LOGIN_ID_PATTERN.test("a".repeat(31))).toBe(true);
    expect(LOGIN_ID_PATTERN.test("ab")).toBe(false);
    expect(LOGIN_ID_PATTERN.test("a".repeat(32))).toBe(false);
  });
});

describe("validateSellerApply", () => {
  const valid = {
    officialName: "デモ株式会社",
    loginId: "demo-apply-01",
    contactEmail: "contact@example.com",
    contactName: "担当 太郎",
    location: "東京都千代田区",
    regionScope: "全国",
    websiteUrl: "https://example.com",
    inviteCode: "",
  };

  it("必須項目が揃えば通る", () => {
    const result = validateSellerApply(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.loginId).toBe("demo-apply-01");
    expect(result.input.websiteUrl).toBe("https://example.com/");
    expect(result.input.inviteCode).toBeNull();
  });

  it("login_id の形式エラーをフィールドに返す", () => {
    const result = validateSellerApply({ ...valid, loginId: "AB" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.loginId).toBeDefined();
  });

  it("主な地域の候補外を弾く", () => {
    const result = validateSellerApply({ ...valid, regionScope: "市区町村" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.regionScope).toBeDefined();
  });

  it("公式サイト URL は空を許可し、不正なスキームを弾く", () => {
    const empty = validateSellerApply({ ...valid, websiteUrl: "  " });
    expect(empty.ok).toBe(true);
    if (empty.ok) expect(empty.input.websiteUrl).toBeNull();

    const bad = validateSellerApply({ ...valid, websiteUrl: "ftp://example.com" });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.fieldErrors.websiteUrl).toBeDefined();
  });
});
