import * as v from "valibot";

import {
  EMAIL_MAX_LENGTH,
  HANDLE_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "./account-rules";

const requiredText = (label: string, max: number) =>
  v.pipe(
    v.string(`${label}を入力してください。`),
    v.trim(),
    v.minLength(1, `${label}を入力してください。`),
    v.maxLength(max, `${label}は${max}文字以内で入力してください。`),
  );
// NFKC で全角の数字・＋・－を半角にし、NFKC で変わらないハイフン類・長音・空白は区切りとして除く
const PHONE_SEPARATORS = /[\s\-‐‑‒–—―−ー]/g;
const phone = v.pipe(
  v.string("電話番号を入力してください。"),
  v.transform((value) => value.normalize("NFKC").replaceAll(PHONE_SEPARATORS, "")),
  v.regex(/^\+?[0-9]{10,15}$/, "電話番号を正しく入力してください。"),
);
/** Supabase に渡す前に、長さと形式を確かめる。 */
export const emailAddressSchema = v.pipe(
  v.string("メールアドレスを入力してください。"),
  v.trim(),
  v.maxLength(EMAIL_MAX_LENGTH, `メールアドレスは${EMAIL_MAX_LENGTH}文字以内で入力してください。`),
  v.email("メールアドレスの形式が正しくありません。"),
);
const optionalText = (max: number) =>
  v.pipe(
    v.string("文字列を入力してください。"),
    v.trim(),
    v.maxLength(max, `${max}文字以内で入力してください。`),
  );

export const generalRegistrationSchema = v.object({
  handle: requiredText("ニックネーム", HANDLE_MAX_LENGTH),
  familyName: requiredText("姓", 80),
  givenName: requiredText("名", 80),
  email: emailAddressSchema,
  phone: v.union([v.literal(""), phone], "電話番号を正しく入力してください。"),
  standpoint: v.picklist(
    ["farmer", "ja", "government", "other"],
    "あなたの属性を選択してください。",
  ),
  postalCode: v.pipe(
    v.string(),
    v.trim(),
    v.transform((value) => value.replaceAll("-", "")),
    v.regex(/^[0-9]{7}$/, "郵便番号を7桁で入力してください。"),
  ),
  prefectureCode: v.pipe(
    v.string("都道府県を選択してください。"),
    v.regex(/^(?:[1-9]|[1-3][0-9]|4[0-7])$/, "都道府県を選択してください。"),
    v.transform(Number),
  ),
  cityStreet: requiredText("市区町村・番地", 300),
  buildingName: optionalText(200),
  password: v.pipe(
    v.string(),
    v.minLength(
      PASSWORD_MIN_LENGTH,
      `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください。`,
    ),
    v.maxLength(
      PASSWORD_MAX_LENGTH,
      `パスワードは${PASSWORD_MAX_LENGTH}文字以内で入力してください。`,
    ),
  ),
  terms: v.literal("on", "利用規約・プライバシーポリシーへの同意が必要です。"),
});

const generalRegistrationFields = v.keyof(generalRegistrationSchema).options;

export type GeneralRegistrationFieldErrors = {
  [Field in (typeof generalRegistrationFields)[number]]?: string;
};

/**
 * 登録情報の入力欄ごとの最初の誤り。送る前のブラウザでも、サーバーと同じ規則で全欄をまとめて確かめる。
 * 送る値（FormData）からサーバーと同じ名前の欄を読む。
 */
export function generalRegistrationFieldErrors(formData: FormData): GeneralRegistrationFieldErrors {
  const result = v.safeParse(
    generalRegistrationSchema,
    Object.fromEntries(generalRegistrationFields.map((name) => [name, formData.get(name)])),
  );
  if (result.success) return {};
  const nested = v.flatten<typeof generalRegistrationSchema>(result.issues).nested ?? {};
  const errors: GeneralRegistrationFieldErrors = {};
  for (const name of generalRegistrationFields) errors[name] = nested[name]?.[0];
  return errors;
}

export const manufacturerRegistrationSchema = v.object({
  officialName: requiredText("法人名", 100),
  corporateNumber: v.pipe(
    v.string(),
    v.trim(),
    v.regex(/^[0-9]{13}$/, "法人番号を13桁で入力してください。"),
  ),
  contactName: requiredText("ご担当者名・部署", 80),
  contactEmail: v.pipe(v.string(), v.trim(), v.email("メールアドレスの形式が正しくありません。")),
  contactPhone: phone,
  location: optionalText(200),
  websiteUrl: v.pipe(
    optionalText(500),
    v.union(
      [
        v.literal(""),
        v.pipe(
          v.string(),
          v.url("公式サイトURLを正しく入力してください。"),
          v.regex(/^https?:\/\//, "公式サイトURLはhttpまたはhttpsで入力してください。"),
        ),
      ],
      "公式サイトURLを正しく入力してください。",
    ),
  ),
  materialRequestNotes: optionalText(2000),
  inviteCode: optionalText(64),
});
