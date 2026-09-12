import { describe, expect, it } from "vitest";

import { validateGeneralSignup } from "@/server/accounts/general";

const validRaw = {
  handle: "農家の山田",
  email: "farmer@example.com",
  password: "farmille-pass",
  standpoint: "farmer",
  familyName: "山田",
  givenName: "太郎",
  phone: "",
  postalCode: "1000001",
  prefectureCode: "13",
  city: "千代田区",
  terms: "on",
};

describe("validateGeneralSignup", () => {
  it("必須項目が揃っていれば型付きの入力に変換する", () => {
    const result = validateGeneralSignup(validRaw);

    expect(result).toEqual({
      ok: true,
      input: { ...validRaw, prefectureCode: 13 },
    });
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

  it("立場は一般ユーザー向けの4択だけを受け付ける", () => {
    for (const standpoint of ["farmer", "ja", "government", "other"]) {
      expect(validateGeneralSignup({ ...validRaw, standpoint })).toMatchObject({
        ok: true,
        input: { standpoint },
      });
    }

    expect(validateGeneralSignup({ ...validRaw, standpoint: "maker_related" })).toMatchObject({
      ok: false,
      fieldErrors: { standpoint: "あなたの立場を選択してください。" },
    });
    expect(validateGeneralSignup({ ...validRaw, standpoint: null })).toMatchObject({
      ok: false,
      fieldErrors: { standpoint: "あなたの立場を選択してください。" },
    });
  });

  it("複数の誤りをフィールド単位で返す", () => {
    const result = validateGeneralSignup({
      ...validRaw,
      handle: "",
      email: "invalid",
      password: "x",
      standpoint: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        "email",
        "handle",
        "password",
        "standpoint",
      ]);
    }
  });
});
