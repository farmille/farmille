import * as v from "valibot";
import { applicationCopy } from "./company-application-copy";

const text = (max: number) => v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));
const optionalText = (max: number) => v.pipe(v.string(), v.trim(), v.maxLength(max));
/** 受付票に残る全種別。removal は受付を終了した旧フォームで、既存の受付票を読むためだけに残す。 */
export const applicationKindSchema = v.picklist([
  "registration",
  "transfer_out",
  "transfer_in",
  "removal",
]);
export type ApplicationKind = v.InferOutput<typeof applicationKindSchema>;
export const submittableKindSchema = v.picklist(["registration", "transfer_out", "transfer_in"]);
export type SubmittableKind = v.InferOutput<typeof submittableKindSchema>;
export const uuidSchema = v.pipe(v.string(), v.uuid());
export const evidenceMimeSchema = v.picklist(["image/jpeg", "image/png", "application/pdf"]);
export const evidencePurposeSchema = v.picklist([
  "package",
  "involvement",
  "owner_agreement",
  "succession",
]);
export const httpUrlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(2000),
  v.url(),
  v.check((url) => /^https?:\/\//.test(url), "HTTPまたはHTTPSのURLを入力してください"),
);
const optionalUrl = v.union([v.literal(""), httpUrlSchema]);
const corporateNumber = v.pipe(v.string(), v.regex(/^\d{13}$/, "法人番号は13桁で入力してください"));
const email = v.pipe(v.string(), v.trim(), v.email(), v.maxLength(254));
const company = {
  companyName: text(200),
  corporateNumber,
  accountId: text(100),
  contactName: text(200),
  department: text(200),
  email,
  phone: text(50),
};
const common = {
  companyName: text(200),
  contactName: text(200),
  department: text(200),
  email,
  phone: text(50),
  signerName: text(200),
  applicationDate: v.pipe(v.string(), v.isoDate()),
  consents: v.array(v.literal(true)),
};
const item = {
  id: uuidSchema,
  materialName: text(300),
  materialUrl: httpUrlSchema,
  evidenceUrl: optionalUrl,
};
export const relationSchema = v.picklist(["manufacturer", "seller", "importer"]);
const relations = v.pipe(
  v.array(relationSchema),
  v.minLength(1),
  v.maxLength(3),
  v.check((values) => new Set(values).size === values.length),
);
const registrationItem = v.variant("target", [
  v.object({
    ...item,
    target: v.literal("new"),
    materialUrl: v.literal(""),
    officialUrl: optionalUrl,
    relations,
  }),
  v.object({ ...item, target: v.literal("existing"), officialUrl: optionalUrl, relations }),
]);
const items = <T extends v.GenericSchema>(schema: T) =>
  v.pipe(
    v.array(schema),
    v.minLength(1),
    v.maxLength(100),
    v.check(
      (rows) =>
        new Set(rows.map((row) => v.parse(v.object({ id: uuidSchema }), row).id)).size ===
        rows.length,
      "資材の行が重複しています",
    ),
  );
export const companyApplicationSchema = v.pipe(
  v.variant("kind", [
    v.object({
      ...common,
      ...company,
      kind: v.literal("registration"),
      items: items(registrationItem),
    }),
    v.object({
      ...common,
      ...company,
      kind: v.literal("transfer_out"),
      items: items(v.object(item)),
      destination: v.object(company),
    }),
    v.object({
      ...common,
      ...company,
      kind: v.literal("transfer_in"),
      items: items(
        v.object({ ...item, ownerName: text(200), ownerInformation: optionalText(10000) }),
      ),
      background: text(10000),
    }),
  ]),
  v.check(
    (input) => input.consents.length === applicationCopy[input.kind].consents.length,
    "すべての確認事項への同意が必要です",
  ),
);
export type CompanyApplicationInput = v.InferOutput<typeof companyApplicationSchema>;
export const receiptAccessSchema = v.object({
  receiptNumber: v.pipe(v.string(), v.regex(/^\d+$/)),
  email,
});
export const evidenceReservationSchema = v.object({
  intentId: uuidSchema,
  itemKey: v.nullable(uuidSchema),
  purpose: evidencePurposeSchema,
  fileName: text(200),
  mime: evidenceMimeSchema,
  size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10 * 1024 * 1024)),
});
export const submissionSchema = v.object({ intentId: uuidSchema, input: companyApplicationSchema });
export const relationLabels = {
  manufacturer: "製造元",
  seller: "販売元",
  importer: "輸入元",
} as const;
export const relationExplanation =
  "「販売元」とは、当該資材のパッケージ上で「販売元」「発売元」等として表記され、国内における販売を代表する立場にある企業を指します。特定地域のみを担当する販売代理店・卸・小売店は含まれません。";
export const evidenceExplanation =
  "貴社名の表記箇所を含む、当該資材のパッケージ・ラベルの画像またはPDF、またはパッケージ画像が掲載されている公式サイト・ECサイトの製品ページURLをご提出ください。";
export const successionExplanation =
  "パッケージに企業名の記載がない場合は、契約書の写し・官報公告・プレスリリース等、資材との関係を確認できる資料をご提出ください。本申請に関係のない機密情報・個人情報等はマスキングしていただいて構いません。";
export const historyExplanation =
  "Farmilleが移行の経緯を確認するための資料です。いずれか一方でも構いませんので、できるだけ添付してください。資料がない場合、確認に時間がかかったり、移行をお受けできなかったりすることがあります。どうしても添付が難しい場合は、「移行の経緯」に理由をご記入ください。契約書等は、本申請に関係のない機密情報・個人情報等をマスキングしていただいて構いません。";

export type ApplicationSubmission = v.InferOutput<typeof submissionSchema>;
export type ReceiptAccess = v.InferOutput<typeof receiptAccessSchema>;
export type EvidenceReservation = v.InferOutput<typeof evidenceReservationSchema>;
