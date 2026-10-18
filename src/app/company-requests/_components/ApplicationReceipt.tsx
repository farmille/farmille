import type { ApplicationReceipt as Receipt } from "@/server/company-applications";
import { applicationReceiptDocument } from "@/lib/company-application-receipt";
import { Notice } from "@/components/form";
import { ReceiptButtons } from "./ReceiptButtons";
import { ReceiptSheet } from "./ReceiptSheet";
import { css } from "../../../../styled-system/css";

/** 画面だけに出す案内と操作の下に、印刷する用紙を置く。印刷では用紙だけが残る（globals.css）。 */
export function ApplicationReceipt({
  receipt,
  hideMissingCorporateNumber = false,
}: {
  receipt: Receipt;
  hideMissingCorporateNumber?: boolean;
}) {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
      <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
        <p className={css({ textStyle: "supporting" })}>
          ご申請を受け付けました。お手続きが完了した場合やご提出資料に不足がある場合は、担当者メールアドレス宛にご連絡します。
        </p>
        {receipt.delivery.sent_at ? (
          <Notice tone="success">控えメールを送信しました。</Notice>
        ) : (
          <Notice tone="warn">
            受付済みです。控えメールは未送信です。下のボタンから再送できます。
          </Notice>
        )}
        <ReceiptButtons id={receipt.application.id} sent={receipt.delivery.sent_at !== null} />
      </div>
      <ReceiptSheet
        receiptDocument={applicationReceiptDocument(receipt, {
          omitMissingCorporateNumber: hideMissingCorporateNumber,
        })}
      />
    </div>
  );
}
