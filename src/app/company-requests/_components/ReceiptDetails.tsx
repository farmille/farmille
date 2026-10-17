import type { ReactNode } from "react";

import { TextLink } from "@/components";
import { Icon } from "@/components/Icon";
import type {
  ApplicationReceiptDocument,
  ReceiptAttachment,
  ReceiptConsentGroup,
  ReceiptParty,
} from "@/lib/company-application-receipt";

import { ReceiptFields } from "./ReceiptFields";

import { css } from "../../../../styled-system/css";

// 見出しの列と中身の列。並ぶ幅が無ければ見出しを中身の上へ折り返す。
const sectionStyle = css({
  display: "flex",
  flexWrap: "wrap",
  columnGap: "4",
  rowGap: "2",
});

const sectionTitle = css({
  flexShrink: "0",
  flexBasis: "32",
  textStyle: "supporting",
  fontWeight: "bold",
  breakAfter: "avoid",
});

const sectionBody = css({
  flexGrow: "1",
  flexBasis: "64",
  minW: "0",
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const detailText = css({
  textStyle: "supporting",
  whiteSpace: "pre-line",
  overflowWrap: "anywhere",
});

// 段落になる長い文は、文節ではなく字詰めで折り返す。文節で折ると行の長さがそろわない。
const paragraphText = css({
  textStyle: "supporting",
  whiteSpace: "pre-line",
  overflowWrap: "anywhere",
  wordBreak: "normal",
});

const mutedText = css({ textStyle: "supporting", color: "text.muted", overflowWrap: "anywhere" });

const plainList = css({
  listStyle: "none",
  m: "0",
  p: "0",
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={sectionStyle}>
      <h3 className={sectionTitle}>{title}</h3>
      <div className={sectionBody}>{children}</div>
    </section>
  );
}

function PartyName({ party }: { party: ReceiptParty }) {
  return (
    <p className={detailText}>
      <span className={css({ fontWeight: "bold" })}>{party.companyName}</span>
      {"\n"}
      {[party.department, party.contactName].filter((part) => part !== "").join("　")}
    </p>
  );
}

const sizeFormat = new Intl.NumberFormat("ja-JP");

function Attachments({ attachments }: { attachments: ReceiptAttachment[] }) {
  if (attachments.length === 0) return <p className={detailText}>なし</p>;
  return (
    <ul className={plainList}>
      {attachments.map((file) => (
        <li className={css({ breakInside: "avoid" })} key={file.id}>
          <p className={detailText}>
            <TextLink
              href={`/api/company-application-evidence/${file.id}`}
              className={css({
                _print: { color: "text.default", fontWeight: "normal", textDecoration: "none" },
              })}
            >
              {file.fileName}
            </TextLink>
          </p>
          <p className={mutedText}>
            {file.owner}／{file.purpose}・{sizeFormat.format(Math.ceil(file.byteSize / 1024))}KB
          </p>
        </li>
      ))}
    </ul>
  );
}

function Consents({ groups }: { groups: ReceiptConsentGroup[] }) {
  return groups.map((group, groupIndex) => (
    <div className={css({ display: "flex", flexDirection: "column", gap: "2" })} key={groupIndex}>
      <p className={mutedText}>
        版 {group.version}・同意日時 {group.acceptedAt}
      </p>
      <ul className={plainList}>
        {group.texts.map((text, index) => (
          <li
            className={css({ display: "flex", gap: "2", breakInside: "avoid" })}
            key={`${index}-${text}`}
          >
            <Icon
              name="check_box"
              size="sm"
              className={css({
                mt: "0.5",
                color: "primary.700",
                _print: { color: "text.default" },
              })}
            />
            <span className={paragraphText}>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  ));
}

/** 申請者の識別情報・移行先・経緯・添付資料・確認事項を、見出しと中身の2列で並べる。 */
export function ReceiptDetails({
  receiptDocument,
}: {
  receiptDocument: ApplicationReceiptDocument;
}) {
  const { applicant, destination, background, attachments, consents } = receiptDocument;
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "6" })}>
      <DetailSection title="申請者">
        <ReceiptFields fields={applicant.details} />
      </DetailSection>
      {destination === null ? null : (
        <DetailSection title="移行先企業">
          <PartyName party={destination} />
          <ReceiptFields fields={destination.details} />
        </DetailSection>
      )}
      {background === null ? null : (
        <DetailSection title="移行の経緯">
          <p className={paragraphText}>{background}</p>
        </DetailSection>
      )}
      <DetailSection title="添付資料">
        <Attachments attachments={attachments} />
      </DetailSection>
      {consents.length === 0 ? null : (
        <DetailSection title="確認事項">
          <Consents groups={consents} />
        </DetailSection>
      )}
    </div>
  );
}
