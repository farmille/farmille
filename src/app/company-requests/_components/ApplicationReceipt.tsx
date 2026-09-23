import type { ApplicationReceipt as Receipt } from "@/server/company-applications";
import { applicationReceiptLines } from "@/lib/company-application-receipt";
import { ReceiptButtons } from "./ReceiptButtons";
import { css } from "../../../../styled-system/css";
export function ApplicationReceipt({ receipt }: { receipt: Receipt }) {
  return (
    <article className="application-receipt">
      <p>
        ご申請を受け付けました。お手続きが完了した場合やご提出資料に不足がある場合は、担当者メールアドレス宛にご連絡します。
      </p>
      <p role="status">
        {receipt.delivery.sent_at
          ? "控えメールを送信しました。"
          : "受付済みです。控えメールは未送信です。下のボタンから再送できます。"}
      </p>
      <ReceiptButtons id={receipt.application.id} sent={receipt.delivery.sent_at !== null} />
      <div
        className={css({
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          fontSize: "md",
          lineHeight: "1.8",
          py: "6",
        })}
      >
        {applicationReceiptLines(receipt).join("\n")}
      </div>
      <div className="application-print-hidden">
        <h2>添付資料</h2>
        {receipt.evidence.map((file) => (
          <p key={file.id}>
            <a href={`/api/company-application-evidence/${file.id}`}>
              {file.file_name}をダウンロード
            </a>
          </p>
        ))}
      </div>
      <p>訂正が必要な場合は、受付番号を添えて運営へご連絡ください。</p>
    </article>
  );
}
