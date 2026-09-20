import * as v from "valibot";

import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "./account-rules";

const requiredText = (label: string, max: number) =>
  v.pipe(
    v.string(`${label}を入力してください。`),
    v.trim(),
    v.minLength(1, `${label}を入力してください。`),
    v.maxLength(max, `${label}は${max}文字以内で入力してください。`),
  );
const phone = v.pipe(
  v.string("電話番号を入力してください。"),
  v.trim(),
  v.transform((value) => value.replaceAll(/[ -]/g, "")),
  v.regex(/^\+?[0-9]{10,15}$/, "電話番号を正しく入力してください。"),
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
  email: v.pipe(v.string(), v.trim(), v.email("メールアドレスの形式が正しくありません。")),
  phone: v.union([v.literal(""), phone], "電話番号を正しく入力してください。"),
  standpoint: v.picklist(
    ["farmer", "ja", "government", "other"],
    "あなたの立場を選択してください。",
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
  city: requiredText("市区町村", 100),
  streetAddress: requiredText("番地", 200),
  buildingName: optionalText(200),
  password: v.pipe(
    v.string(),
    v.minLength(
      PASSWORD_MIN_LENGTH,
      `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください。`,
    ),
    v.maxLength(PASSWORD_MAX_LENGTH),
  ),
  terms: v.literal("on", "利用規約・感想口コミガイドラインへの同意が必要です。"),
});

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
