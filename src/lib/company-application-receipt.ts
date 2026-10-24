import type { ApplicationReceipt } from "@/server/company-applications";
import { applicationTitle } from "./company-application-copy";
import {
  applicationKindSchema,
  evidencePurposeSchema,
  relationLabels,
  relationSchema,
} from "./company-application";
import * as v from "valibot";

/** 受付票の1項目。回答の無い項目は作らない。 */
export type ReceiptField = { label: string; value: string };

/** 申請者・移行先企業。宛名に使う法人名・部署名・担当者名と、それ以外の項目に分ける。 */
export type ReceiptParty = {
  companyName: string;
  department: string;
  contactName: string;
  details: ReceiptField[];
};

export type ReceiptItem = {
  name: string;
  /** 資材ごとの申請内容。掲載・権限申請の資材だけが持ち、受付票では資材名と並べて見せる。 */
  request: string | null;
  fields: ReceiptField[];
};

export type ReceiptAttachment = {
  id: string;
  /** 対象資材の名前。資材に紐づかない資料は「申請全体」。 */
  owner: string;
  purpose: string;
  fileName: string;
  byteSize: number;
};

/** 同じ版・同じ日時に同意した確認事項のまとまり。同意の順を保つ。 */
export type ReceiptConsentGroup = { version: string; acceptedAt: string; texts: string[] };

/** 受付票に載せる内容。画面・印刷・控えメールが同じものを使う。 */
export type ApplicationReceiptDocument = {
  title: string;
  receiptNumber: number;
  submittedAt: string;
  applicant: ReceiptParty;
  items: ReceiptItem[];
  destination: ReceiptParty | null;
  background: string | null;
  attachments: ReceiptAttachment[];
  consents: ReceiptConsentGroup[];
  applicationDate: string;
  signerName: string;
  recipient: string;
};

type ReceiptEntry = [label: string, value: string | null | undefined];
type ReceiptCompany = Pick<
  ApplicationReceipt["application"],
  "company_name" | "department" | "contact_name" | "account_id" | "email" | "phone"
>;

const targetSchema = v.picklist(["new", "existing"]);
const targetLabels = {
  new: "資材の新規掲載",
  existing: "掲載済み資材の資材オーナー権限",
} as const;
const requestTypeSchema = v.picklist(["hidden", "discontinued"]);
const requestTypeLabels = {
  hidden: "資材ページの非公開",
  discontinued: "終売の表示",
} as const;
const purposeLabels = {
  package: "パッケージ資料",
  involvement: "関与を確認できる資料",
  owner_agreement: "現オーナー同意資料",
  succession: "移行の事実資料",
} as const;

const receiptDateTime = (value: string) =>
  `${new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date(value))}（日本時間）`;

const receiptFields = (entries: ReceiptEntry[]): ReceiptField[] =>
  entries.flatMap(([label, value]) => (value ? [{ label, value }] : []));

const receiptParty = (
  company: ReceiptCompany,
  corporateNumber: string | null,
  companyUrl?: string,
): ReceiptParty => ({
  companyName: company.company_name,
  department: company.department,
  contactName: company.contact_name,
  details: receiptFields([
    ["法人番号", corporateNumber],
    ["Farmille企業会員ID", company.account_id],
    ["担当者メールアドレス", company.email],
    ["電話番号", company.phone],
    ["会社概要URL", companyUrl],
  ]),
});

const receiptItem = (item: ApplicationReceipt["items"][number]): ReceiptItem => {
  const registration = item.company_application_registration_items;
  const owner = item.company_application_transfer_in_items;
  const removal = item.company_application_removal_items;
  return {
    name: item.material_name,
    request: registration && targetLabels[v.parse(targetSchema, registration.target)],
    fields: receiptFields([
      ["FarmilleページURL", item.material_url],
      ["製品公式ページURL", registration?.official_url],
      [
        "関係",
        item.company_application_relations
          .map(({ relation }) => relationLabels[v.parse(relationSchema, relation)])
          .join("・"),
      ],
      ...item.company_application_evidence_links.map(
        ({ url }): ReceiptEntry => ["パッケージ資料URL", url],
      ),
      ["現在のオーナー企業", owner?.owner_name],
      ["その他分かる情報", owner?.owner_information],
      ["申請種別", removal && requestTypeLabels[v.parse(requestTypeSchema, removal.request_type)]],
      ["申請理由", removal?.reason],
      ["理由の開示", removal && (removal.disclose_reason ? "開示してよい" : "開示を希望しない")],
    ]),
  };
};

const attachmentOwner = (items: ApplicationReceipt["items"], itemKey: string | null) => {
  if (itemKey === null) return "申請全体";
  const item = items.find(({ id }) => id === itemKey);
  // 申請に無い資材への資料は受付時に拒んでいるので、見つからなければデータが壊れている。
  if (!item) throw new Error(`添付資料の対象資材が見つかりません：${itemKey}`);
  return item.material_name;
};

const consentGroups = (consents: ApplicationReceipt["consents"]) => {
  const groups: ReceiptConsentGroup[] = [];
  for (const consent of consents) {
    const acceptedAt = receiptDateTime(consent.accepted_at);
    const last = groups.at(-1);
    // 受付票に出す秒の単位で同じなら1つにまとめ、同じ見出しのまとまりを並べない。
    if (last?.version === consent.version && last.acceptedAt === acceptedAt)
      last.texts.push(consent.text_snapshot);
    else groups.push({ version: consent.version, acceptedAt, texts: [consent.text_snapshot] });
  }
  return groups;
};

export function applicationReceiptDocument(
  receipt: ApplicationReceipt,
  { omitMissingCorporateNumber = false }: { omitMissingCorporateNumber?: boolean } = {},
): ApplicationReceiptDocument {
  const a = receipt.application;
  const destination = receipt.transferOut;
  return {
    title: applicationTitle(v.parse(applicationKindSchema, a.kind)),
    receiptNumber: a.receipt_number,
    submittedAt: receiptDateTime(a.submitted_at),
    applicant: receiptParty(
      a,
      a.corporate_number ?? (omitMissingCorporateNumber ? null : "該当なし"),
      receipt.removal?.company_url,
    ),
    items: receipt.items.map(receiptItem),
    destination: destination && receiptParty(destination, destination.corporate_number),
    background: receipt.transferIn?.background ?? null,
    attachments: receipt.evidence.map((file) => ({
      id: file.id,
      owner: attachmentOwner(receipt.items, file.item_key),
      purpose: purposeLabels[v.parse(evidencePurposeSchema, file.purpose)],
      fileName: file.file_name,
      byteSize: file.byte_size,
    })),
    consents: consentGroups(receipt.consents),
    applicationDate: a.application_date,
    signerName: a.signer_name,
    recipient: receipt.delivery.recipient,
  };
}

const fieldLine = ({ label, value }: ReceiptField) => `${label}：${value}`;
const partyLines = (party: ReceiptParty) => [
  `法人名：${party.companyName}`,
  `部署名：${party.department}`,
  `担当者名：${party.contactName}`,
  ...party.details.map(fieldLine),
];

/** 控えメールの本文に載せる行。 */
export function applicationReceiptLines(
  receipt: ApplicationReceipt,
  options?: { omitMissingCorporateNumber?: boolean },
): string[] {
  const receiptDocument = applicationReceiptDocument(receipt, options);
  return [
    receiptDocument.title,
    `受付番号：${receiptDocument.receiptNumber}`,
    `受付日時：${receiptDocument.submittedAt}`,
    ...partyLines(receiptDocument.applicant),
    ...receiptDocument.items.flatMap((item, index) => [
      "",
      `対象資材 ${index + 1}：${item.name}`,
      ...(item.request === null ? [] : [`申請内容：${item.request}`]),
      ...item.fields.map(fieldLine),
    ]),
    ...(receiptDocument.destination
      ? ["", "移行先企業", ...partyLines(receiptDocument.destination)]
      : []),
    ...(receiptDocument.background === null
      ? []
      : ["", `移行の経緯：${receiptDocument.background}`]),
    "",
    "添付資料",
    ...(receiptDocument.attachments.length === 0
      ? ["なし"]
      : receiptDocument.attachments.map(
          (file) => `${file.owner}／${file.purpose}：${file.fileName}（${file.byteSize}バイト）`,
        )),
    "",
    "確認事項",
    ...receiptDocument.consents.flatMap((group) =>
      group.texts.map((text) => `☑ ${text}（版：${group.version}、同意日時：${group.acceptedAt}）`),
    ),
    "",
    `申請日：${receiptDocument.applicationDate}`,
    `署名：${receiptDocument.signerName}`,
    `控えメール送信先：${receiptDocument.recipient}`,
  ];
}
