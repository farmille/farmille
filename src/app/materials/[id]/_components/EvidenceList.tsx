import { SectionHeading } from "@/components";
import type { MaterialEvidence } from "@/server/queries/materials";
import { css } from "../../../../../styled-system/css";

const evidenceCard = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  overflow: "hidden",
});

const EVIDENCE_TYPE_PRESENTATIONS = [
  { value: "sds", label: "SDS" },
  { value: "paper", label: "論文" },
  { value: "trial", label: "試験結果" },
  { value: "leaflet", label: "資料" },
] as const;

function evidenceTypeLabel(value: string): string {
  const presentation = EVIDENCE_TYPE_PRESENTATIONS.find((candidate) => candidate.value === value);
  if (presentation === undefined) {
    throw new Error(`未対応のエビデンス種別です：${value}`);
  }
  return presentation.label;
}

function evidenceHref(evidence: MaterialEvidence): string | null {
  const href = evidence.file_url ?? evidence.external_url;

  if (href === null) {
    return null;
  }

  const url = new URL(href);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`エビデンス ${evidence.id} のURL形式が不正です。`);
  }

  return href;
}

function EvidenceRows({ evidences }: { evidences: MaterialEvidence[] }) {
  return (
    <div className={evidenceCard}>
      {evidences.map((evidence, index) => {
        const href = evidenceHref(evidence);
        const content = (
          <>
            <span className={css({ fontSize: "sm", fontWeight: "700", lineHeight: "1.5" })}>
              {evidence.title}
            </span>
            <span className={css({ fontSize: "xs", color: "text.subtle" })}>
              {evidenceTypeLabel(evidence.evidence_type)}
            </span>
          </>
        );
        const rowClass = css({
          display: "flex",
          flexDirection: "column",
          gap: "1",
          px: "3.5",
          py: "3",
          color: "inherit",
          textDecoration: "none",
          borderTopWidth: index === 0 ? "0" : "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
        });

        return href ? (
          <a key={evidence.id} href={href} target="_blank" rel="noreferrer" className={rowClass}>
            {content}
          </a>
        ) : (
          <div key={evidence.id} className={rowClass}>
            {content}
            <span className={css({ fontSize: "xs", color: "accent.warn" })}>
              参照先が設定されていません
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function EvidenceList({ evidences }: { evidences: MaterialEvidence[] }) {
  const sds = evidences.filter(({ evidence_type }) => evidence_type === "sds");
  const studies = evidences.filter(({ evidence_type }) => evidence_type !== "sds");

  if (evidences.length === 0) {
    return null;
  }

  return (
    <>
      {sds.length > 0 ? (
        <section aria-labelledby="sds-heading">
          <SectionHeading
            title={
              <span id="sds-heading">
                安全データシート（SDS）
                <span className={css({ ml: "2", fontSize: "xs", color: "text.subtle" })}>
                  製造元が設定
                </span>
              </span>
            }
          />
          <EvidenceRows evidences={sds} />
        </section>
      ) : null}
      {studies.length > 0 ? (
        <section aria-labelledby="studies-heading">
          <SectionHeading
            title={
              <span id="studies-heading">
                試験結果・論文データ
                <span className={css({ ml: "2", fontSize: "xs", color: "text.subtle" })}>
                  製造元が設定
                </span>
              </span>
            }
          />
          <EvidenceRows evidences={studies} />
        </section>
      ) : null}
    </>
  );
}
