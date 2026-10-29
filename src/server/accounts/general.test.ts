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
  cityStreet: "千代田区千代田1-1",
  buildingName: "",
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

  it("ニックネームは前後の空白を除き、空と31文字以上を弾く", () => {
    expect(validateGeneralSignup({ ...validRaw, handle: "  山田  " })).toMatchObject({
      ok: true,
      input: { handle: "山田" },
    });
    expect(validateGeneralSignup({ ...validRaw, handle: "   " })).toMatchObject({ ok: false });
    expect(validateGeneralSignup({ ...validRaw, handle: "あ".repeat(31) })).toMatchObject({
      ok: false,
    });
  });

  it("市区町村・番地は必須で、建物名は任意とし、前後の空白と長さを検証する", () => {
    expect(
      validateGeneralSignup({
        ...validRaw,
        cityStreet: "  千代田区千代田1-1  ",
        buildingName: "  本館101  ",
      }),
    ).toMatchObject({
      ok: true,
      input: { cityStreet: "千代田区千代田1-1", buildingName: "本館101" },
    });
    expect(validateGeneralSignup({ ...validRaw, cityStreet: "あ".repeat(300) })).toMatchObject({
      ok: true,
      input: { cityStreet: "あ".repeat(300) },
    });
    for (const cityStreet of [null, "", "　 ", "あ".repeat(301)]) {
      expect(validateGeneralSignup({ ...validRaw, cityStreet })).toMatchObject({ ok: false });
    }
    expect(validateGeneralSignup({ ...validRaw, buildingName: "あ".repeat(201) })).toMatchObject({
      ok: false,
    });
  });

  it("メールアドレスは254文字まで受け付け、超えたら上限を書いたエラーを返す", () => {
    const email = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.jp`;
    expect(email).toHaveLength(254);
    expect(validateGeneralSignup({ ...validRaw, email })).toMatchObject({
      ok: true,
      input: { email },
    });
    expect(validateGeneralSignup({ ...validRaw, email: `a${email}` })).toMatchObject({
      ok: false,
      fieldErrors: { email: "メールアドレスは254文字以内で入力してください。" },
    });
  });

  it("電話番号は全角の数字・ハイフン類・空白を半角に直し、数字だけにして受け付ける", () => {
    for (const phone of [
      "０９０－１２３４－５６７８",
      "090‐1234‐5678",
      "090―1234―5678",
      "090−1234−5678",
      "090ー1234ー5678",
      "090　1234　5678",
      " 090-1234-5678 ",
    ]) {
      expect(validateGeneralSignup({ ...validRaw, phone })).toMatchObject({
        ok: true,
        input: { phone: "09012345678" },
      });
    }
    expect(
      validateGeneralSignup({ ...validRaw, phone: "＋８１ ９０ １２３４ ５６７８" }),
    ).toMatchObject({ ok: true, input: { phone: "+819012345678" } });
    for (const phone of ["090-1234", "０９０－ＡＢＣＤ－５６７８"]) {
      expect(validateGeneralSignup({ ...validRaw, phone })).toMatchObject({
        ok: false,
        fieldErrors: { phone: "電話番号を正しく入力してください。" },
      });
    }
  });

  it("文字数の上限を超えた欄は、上限を書いたエラーを返す", () => {
    expect(
      validateGeneralSignup({
        ...validRaw,
        familyName: "山".repeat(81),
        givenName: "山".repeat(5000),
        cityStreet: "あ".repeat(301),
        buildingName: "あ".repeat(201),
        password: "a".repeat(129),
      }),
    ).toEqual({
      ok: false,
      fieldErrors: {
        familyName: "姓は80文字以内で入力してください。",
        givenName: "名は80文字以内で入力してください。",
        cityStreet: "市区町村・番地は300文字以内で入力してください。",
        buildingName: "200文字以内で入力してください。",
        password: "パスワードは128文字以内で入力してください。",
      },
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
      fieldErrors: { standpoint: "あなたの属性を選択してください。" },
    });
    expect(validateGeneralSignup({ ...validRaw, standpoint: null })).toMatchObject({
      ok: false,
      fieldErrors: { standpoint: "あなたの属性を選択してください。" },
    });
  });

  it("複数の誤りをフィールド単位で返す", () => {
    const result = validateGeneralSignup({
      ...validRaw,
      handle: "",
      email: "invalid",
      password: "short12",
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
    expect(validateGeneralSignup({ ...validRaw, password: "a".repeat(129) })).toMatchObject({
      ok: false,
    });
  });
});
