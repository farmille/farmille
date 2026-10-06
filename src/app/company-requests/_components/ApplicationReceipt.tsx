import type { ApplicationReceipt as Receipt } from "@/server/company-applications";
import { applicationReceiptLines } from "@/lib/company-application-receipt";
import { SectionHeading, TextLink } from "@/components";
import { ReceiptButtons } from "./ReceiptButtons";
import { css, cx } from "../../../../styled-system/css";
export function ApplicationReceipt({
  receipt,
  hideMissingCorporateNumber = false,
}: {
  receipt: Receipt;
  /** 申請者向けの受付票（公開の受付票ページ）だけ、法人番号の無い申請で「法人番号：該当なし」を出さない */
  hideMissingCorporateNumber?: boolean;
}) {
  return (
    <article className={cx("application-receipt", css({ fontSize: "md", lineHeight: "relaxed" }))}>
      <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
        <p>
          ご申請を受け付けました。お手続きが完了した場合やご提出資料に不足がある場合は、担当者メールアドレス宛にご連絡します。
        </p>
        <p role="status">
          {receipt.delivery.sent_at
            ? "控えメールを送信しました。"
            : "受付済みです。控えメールは未送信です。下のボタンから再送できます。"}
        </p>
        <ReceiptButtons id={receipt.application.id} sent={receipt.delivery.sent_at !== null} />
      </div>
      <div
        className={css({
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          fontSize: "md",
          lineHeight: "1.8",
          py: "6",
        })}
      >
        {applicationReceiptLines(receipt, {
          omitMissingCorporateNumber: hideMissingCorporateNumber,
        }).join("\n")}
      </div>
      <div className="application-print-hidden">
        <SectionHeading title="添付資料" first />
        <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
          {receipt.evidence.map((file) => (
            <p key={file.id}>
              <TextLink href={`/api/company-application-evidence/${file.id}`}>
                {file.file_name}をダウンロード
              </TextLink>
            </p>
          ))}
        </div>
      </div>
      <p className={css({ mt: "4" })}>訂正が必要な場合は、受付番号を添えて運営へご連絡ください。</p>
    </article>
  );
}
