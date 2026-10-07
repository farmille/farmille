import type { ApplicationReceipt } from "@/server/company-applications";
import { applicationCopy } from "./company-application-copy";
import { relationLabels, applicationKindSchema } from "./company-application";
import * as v from "valibot";

const receiptDateTime = (value: string) =>
  `${new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date(value))}（日本時間）`;

export function applicationReceiptLines(
  receipt: ApplicationReceipt,
  { omitMissingCorporateNumber = false }: { omitMissingCorporateNumber?: boolean } = {},
) {
  const a = receipt.application;
  const kind = v.parse(applicationKindSchema, a.kind);
  const corporateNumberLines =
    a.corporate_number === null && omitMissingCorporateNumber
      ? []
      : [`法人番号：${a.corporate_number ?? "該当なし"}`];
  const lines = [
    applicationCopy[kind].title,
    `受付番号：${a.receipt_number}`,
    `受付日時：${receiptDateTime(a.submitted_at)}`,
    `法人名：${a.company_name}`,
    ...corporateNumberLines,
    `FarmilleアカウントID：${a.account_id}`,
    `担当者名：${a.contact_name}`,
    `部署名：${a.department}`,
    `担当者メールアドレス：${a.email}`,
    `電話番号：${a.phone}`,
  ];
  if (receipt.removal) lines.push(`会社概要URL：${receipt.removal.company_url}`);
  for (const [position, item] of receipt.items.entries()) {
    lines.push(
      "",
      `対象資材 ${position + 1}：${item.material_name}`,
      `FarmilleページURL：${item.material_url}`,
    );
    const registration = item.company_application_registration_items;
    if (registration)
      lines.push(
        `申請内容：${registration.target === "new" ? "資材情報の新規掲載" : "掲載済み資材の資材オーナー権限"}`,
        `製品公式ページURL：${registration.official_url}`,
      );
    for (const relation of item.company_application_relations)
      lines.push(
        `関係：${relationLabels[v.parse(v.picklist(["manufacturer", "seller", "importer"]), relation.relation)]}`,
      );
    for (const link of item.company_application_evidence_links)
      lines.push(`パッケージ資料URL：${link.url}`);
    const owner = item.company_application_transfer_in_items;
    if (owner)
      lines.push(
        `現在のオーナー企業：${owner.owner_name}`,
        `その他分かる情報：${owner.owner_information}`,
      );
    const removal = item.company_application_removal_items;
    if (removal)
      lines.push(
        `申請種別：${removal.request_type === "hidden" ? "資材ページの非表示" : "終売・廃盤の表示"}`,
        `申請理由：${removal.reason}`,
        `理由の開示：${removal.disclose_reason ? "開示してよい" : "開示を希望しない"}`,
      );
  }
  const d = receipt.transferOut;
  if (d)
    lines.push(
      "",
      "移行先企業",
      `法人名：${d.company_name}`,
      `法人番号：${d.corporate_number}`,
      `FarmilleアカウントID：${d.account_id}`,
      `担当者名：${d.contact_name}`,
      `部署名：${d.department}`,
      `担当者メールアドレス：${d.email}`,
      `電話番号：${d.phone}`,
    );
  if (receipt.transferIn) lines.push("", `移行の経緯：${receipt.transferIn.background}`);
  lines.push("", "添付資料");
  const purposes = {
    package: "パッケージ資料",
    involvement: "関与を確認できる資料",
    owner_agreement: "現オーナー同意資料",
    succession: "移行の事実資料",
  } as const;
  for (const file of receipt.evidence)
    lines.push(
      `${file.item_key ? receipt.items.find((item) => item.id === file.item_key)?.material_name : "申請全体"}／${purposes[v.parse(v.picklist(["package", "involvement", "owner_agreement", "succession"]), file.purpose)]}：${file.file_name}（${file.byte_size}バイト）`,
    );
  lines.push("", "確認事項");
  for (const consent of receipt.consents)
    lines.push(
      `☑ ${consent.text_snapshot}（版：${consent.version}、同意日時：${receiptDateTime(consent.accepted_at)}）`,
    );
  lines.push(
    "",
    `申請日：${a.application_date}`,
    `署名：${a.signer_name}`,
    `控えメール送信先：${receipt.delivery.recipient}`,
  );
  return lines;
}
