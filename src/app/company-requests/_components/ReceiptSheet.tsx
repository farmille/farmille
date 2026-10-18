import { formatDateJa, surfaceCardRecipe } from "@/components";
import { BrandMark } from "@/components/BrandMark";
import type { ApplicationReceiptDocument, ReceiptField } from "@/lib/company-application-receipt";

import { ReceiptDetails } from "./ReceiptDetails";
import { ReceiptFields } from "./ReceiptFields";
import { ReceiptItems } from "./ReceiptItems";
import { ReceiptSprig } from "./ReceiptSprig";

import { css, cx } from "../../../../styled-system/css";

// 用紙そのものがカード。印刷では @page の余白が縁の代わりになるので、枠と影と内側の余白を外す。
const sheet = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  display: "flex",
  flexDirection: "column",
  gap: { base: "8", tab: "10" },
  px: { base: "5", tab: "12" },
  py: { base: "7", tab: "12" },
  color: "text.default",
  // 左下の装画を角丸で切り取る。印刷では globals.css が overflow を戻す。
  overflow: "clip",
  // 長音記号や小書きの仮名を行頭に置かない（「フォ／ーム」を避ける）。短い文は、対応するブラウザでは文節の切れ目で行の長さをならして折り返す（「くだ／さい。」を避ける）。
  lineBreak: "strict",
  wordBreak: "auto-phrase",
  textWrap: "pretty",
  _print: { borderWidth: "0", borderRadius: "0", boxShadow: "none", p: "0", gap: "8" },
});

const letterhead = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "flex-start",
  columnGap: "6",
  rowGap: "5",
  pb: "6",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.strong",
  breakInside: "avoid",
});

const brand = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  color: "text.brand",
  textStyle: "title",
  fontWeight: "extrabold",
});

const issuerLines = css({
  mt: "2",
  fontStyle: "normal",
  textStyle: "supporting",
  color: "text.muted",
});

const titleBlock = css({ ml: "auto", textAlign: "end" });

const titleStyle = css({ fontSize: "2xl", lineHeight: "snug" });

const numberLine = css({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "baseline",
  gap: "2",
  mt: "1",
});

const numberStyle = css({
  fontSize: "display",
  lineHeight: "none",
  fontWeight: "medium",
  fontVariantNumeric: "tabular-nums",
});

const parties = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  columnGap: "8",
  rowGap: "6",
  breakInside: "avoid",
});

// 装画は左下の角。PC と印刷では結びの文と署名を右の列に積み、スマホでは結びの文を全幅にして署名を装画の右に置く。
const footer = css({
  display: "grid",
  gridTemplateAreas: {
    base: '"note note" "sprig sign"',
    tab: '"sprig note" "sprig sign"',
    _print: '"sprig note" "sprig sign"',
  },
  gridTemplateColumns: {
    base: "auto minmax(0, 1fr)",
    tab: "minmax(0, 1fr) minmax(0, token(sizes.96))",
    _print: "minmax(0, 1fr) minmax(0, token(sizes.96))",
  },
  alignItems: "end",
  columnGap: "6",
  rowGap: "8",
  breakInside: "avoid",
});

// 用紙の左下の角まで伸ばす。印刷では用紙の内側の余白が無いので伸ばさない。
const sprig = css({
  gridArea: "sprig",
  w: { base: "20", tab: "40" },
  ml: { base: "-5", tab: "-12" },
  mb: { base: "-7", tab: "-12" },
  _print: { w: "36", ml: "0", mb: "0" },
});

/** 申請受付票の用紙。請求書の構成（発行元と番号、宛名と要点、明細と合計、詳細、署名）に沿って組む。 */
export function ReceiptSheet({ receiptDocument }: { receiptDocument: ApplicationReceiptDocument }) {
  const { applicant } = receiptDocument;
  const applicationDate = formatDateJa(receiptDocument.applicationDate);
  const facts: ReceiptField[] = [
    { label: "受付日時", value: receiptDocument.submittedAt },
    { label: "申請日", value: applicationDate },
    { label: "申請の種類", value: receiptDocument.title },
  ];
  return (
    // auto-phrase は日本語と明示された文書でだけ効くので、用紙そのものに lang を持たせる。
    <article className={cx("application-receipt", sheet)} lang="ja">
      <div className={letterhead}>
        <div>
          <p className={brand}>
            <BrandMark />
            <span className={css({ color: "text.default" })}>Farmille</span>
          </p>
          <address className={issuerLines}>
            ファーミル株式会社
            <br />
            contact@farmille.com
          </address>
        </div>
        <div className={titleBlock}>
          <h2 className={titleStyle}>申請受付票</h2>
          <p className={numberLine}>
            <span className={css({ textStyle: "supporting", color: "text.muted" })}>受付番号</span>
            <span className={numberStyle}>{receiptDocument.receiptNumber}</span>
          </p>
        </div>
      </div>

      <div className={parties}>
        <div className={css({ flexGrow: "1", flexBasis: "56" })}>
          <p className={css({ textStyle: "title", fontWeight: "bold" })}>{applicant.companyName}</p>
          <p className={css({ textStyle: "body", mt: "1" })}>
            {applicant.department}　{applicant.contactName} 様
          </p>
        </div>
        <ReceiptFields
          fields={facts}
          labelWidth="narrow"
          className={css({ flexBasis: "80", flexShrink: "1" })}
        />
      </div>

      <ReceiptItems
        items={receiptDocument.items}
        attachmentCount={receiptDocument.attachments.length}
      />

      <ReceiptDetails receiptDocument={receiptDocument} />

      <div className={footer}>
        <ReceiptSprig className={sprig} />
        <div
          className={css({ gridArea: "note", display: "flex", flexDirection: "column", gap: "3" })}
        >
          <p className={css({ textStyle: "supporting", color: "text.muted" })}>
            訂正が必要な場合は、受付番号を添えて運営へご連絡ください。
          </p>
          <ReceiptFields
            labelWidth="full"
            fields={[{ label: "控えメール送信先", value: receiptDocument.recipient }]}
          />
        </div>
        <div className={css({ gridArea: "sign" })}>
          <p
            className={css({
              textStyle: "title",
              pb: "2",
              px: "1",
              borderBottomWidth: "1px",
              borderBottomStyle: "solid",
              borderBottomColor: "text.default",
            })}
          >
            {receiptDocument.signerName}
          </p>
          <p
            className={css({
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              columnGap: "3",
              mt: "1.5",
              textStyle: "note",
              color: "text.muted",
            })}
          >
            <span>署名</span>
            <span>申請日 {applicationDate}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
