import { describe, expect, it } from "vitest";

import { validateGeneralSignup } from "@/server/accounts/general";

const validRaw = {
  handle: "農家の山田",
  email: "farmer@example.com",
  password: "farmille-pass",
  prefectureCode: "8",
  prefecturePublic: "on",
  standpoint: "farmer",
};

describe("validateGeneralSignup", () => {
  it("6項目が揃っていれば型付きの入力に変換する", () => {
    const result = validateGeneralSignup(validRaw);

    expect(result).toEqual({
      ok: true,
      input: {
        handle: "農家の山田",
        email: "farmer@example.com",
        password: "farmille-pass",
        prefectureCode: 8,
        prefecturePublic: true,
        standpoint: "farmer",
      },
    });
  });

  it("公開トグル未送信は「公開しない」として扱う", () => {
    const result = validateGeneralSignup({ ...validRaw, prefecturePublic: null });

    expect(result.ok && result.input.prefecturePublic).toBe(false);
  });

  it("ハンドルネームは前後の空白を除き、空と31文字以上を弾く", () => {
    expect(validateGeneralSignup({ ...validRaw, handle: "  山田  " })).toMatchObject({
      ok: true,
      input: { handle: "山田" },
    });
    expect(validateGeneralSignup({ ...validRaw, handle: "   " })).toMatchObject({ ok: false });
    expect(validateGeneralSignup({ ...validRaw, handle: "あ".repeat(31) })).toMatchObject({
      ok: false,
    });
  });

  it("メール形式・パスワード長を検証する", () => {
    expect(validateGeneralSignup({ ...validRaw, email: "farmer.example.com" })).toMatchObject({
      ok: false,
    });
    expect(validateGeneralSignup({ ...validRaw, password: "short12" })).toMatchObject({
      ok: false,
    });
    expect(validateGeneralSignup({ ...validRaw, password: "a".repeat(129) })).toMatchObject({
      ok: false,
    });
  });

  it("都道府県コードは 1〜47 のみ受け付ける", () => {
    expect(validateGeneralSignup({ ...validRaw, prefectureCode: "0" })).toMatchObject({
      ok: false,
    });
    expect(validateGeneralSignup({ ...validRaw, prefectureCode: "48" })).toMatchObject({
      ok: false,
    });
    expect(validateGeneralSignup({ ...validRaw, prefectureCode: "" })).toMatchObject({ ok: false });
    expect(validateGeneralSignup({ ...validRaw, prefectureCode: "47" })).toMatchObject({
      ok: true,
      input: { prefectureCode: 47 },
    });
  });

  it("立場は 5 択のみ受け付ける", () => {
    expect(validateGeneralSignup({ ...validRaw, standpoint: "researcher" })).toMatchObject({
      ok: false,
    });
    expect(validateGeneralSignup({ ...validRaw, standpoint: null })).toMatchObject({ ok: false });
    expect(validateGeneralSignup({ ...validRaw, standpoint: "maker_related" })).toMatchObject({
      ok: true,
      input: { standpoint: "maker_related" },
    });
  });

  it("複数の誤りをフィールド単位で返す", () => {
    const result = validateGeneralSignup({
      ...validRaw,
      handle: "",
      email: "invalid",
      password: "x",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["email", "handle", "password"]);
    }
  });
});
