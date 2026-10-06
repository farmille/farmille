import Link from "next/link";

import { MockChip, MockNoImage } from "@/app/materials/[id]/_components/MockParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";

type SearchResultCardProps = {
  href: string;
  name: string;
  maker: string;
  /** 感想口コミが無い資材は null（見本どおり★を出さない）。 */
  rating: number | null;
  reviewCount: number;
  reportCount: number;
  savedCount: number;
  description?: string | null;
  categories: string[];
  /** 作物で絞り込んだときの根拠（作目への直接記載）。 */
  directEvidence: string[];
  /** 作物分類としての記載（直接記載が無いときだけ）。 */
  groupEvidence: string[];
  imageSrc?: string;
  preload?: boolean;
};

const evidenceBase = {
  display: "inline-flex",
  alignItems: "center",
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 999,
  padding: "2px 9px",
} as const;

const directStyle = {
  ...evidenceBase,
  background: "var(--green-soft)",
  color: "var(--green-deep)",
  border: "1px solid color-mix(in srgb,var(--green) 30%,var(--line))",
} as const;

const groupStyle = {
  ...evidenceBase,
  background: "var(--bg)",
  color: "var(--ink-2)",
  border: "1px solid var(--line)",
} as const;

/** 見本の CHEV。 */
function ChevronIcon() {
  return (
    <svg
      className="chev"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * 見本 S.search の結果カード（prodCard、`.card.mat-card`）。
 * 作物の根拠バッジは見本の tierBadge（✓ 直接記載＝緑、分類として記載＝灰）に当てる。
 */
export function SearchResultCard({
  href,
  name,
  maker,
  rating,
  reviewCount,
  reportCount,
  savedCount,
  description,
  categories,
  directEvidence,
  groupEvidence,
  imageSrc,
  preload = false,
}: SearchResultCardProps) {
  const genres = categories.slice(0, 3);
  return (
    <Link className="card mat-card" href={href} style={{ padding: "12px 14px", gap: 12 }}>
      <div
        className="mat-img"
        style={{
          width: 112,
          height: 112,
          flex: "0 0 auto",
          background: "#fff",
          border: "1px solid var(--line)",
          padding: 6,
        }}
      >
        {imageSrc ? (
          <Image alt="" src={imageSrc} width={100} height={100} sizes="100px" preload={preload} />
        ) : (
          <MockNoImage />
        )}
      </div>
      <div className="mat-main" style={{ minWidth: 0 }}>
        <div
          className="mat-maker"
          style={{
            margin: "0 0 1px",
            fontSize: 10.5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span>{maker}</span>
        </div>
        <div className="mat-name" style={{ fontSize: 14.5 }}>
          {name}
        </div>
        <div style={{ fontSize: 11.5, marginTop: 3 }}>
          {rating === null ? null : (
            <>
              <span style={{ color: "var(--amber)", fontWeight: 800 }}>
                ★ <span className="tnum">{rating.toFixed(1)}</span>
              </span>
              <span className="muted">（{reviewCount}）</span>
            </>
          )}
          <span className="muted">
            {rating === null ? "" : " ・ "}実証詳細レポート{" "}
            <b
              className="tnum"
              style={{
                color: reportCount > 0 ? "var(--amber)" : "var(--ink)",
                fontSize: reportCount > 0 ? "1.2em" : "1em",
              }}
            >
              {reportCount}
            </b>{" "}
            件 ・ <span style={{ color: "var(--green-deep)" }}>★</span> お気に入り{" "}
            <b className="tnum" style={{ color: "var(--ink)" }}>
              {savedCount}
            </b>
          </span>
        </div>
        {description ? (
          <div
            className="mat-desc"
            style={{
              marginTop: 3,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        ) : null}
        {genres.length > 0 ? (
          <div className="mat-rate" style={{ gap: 5, marginTop: 5, flexWrap: "wrap" }}>
            {genres.map((genre) => (
              <MockChip key={genre} tone="grey">
                {genre}
              </MockChip>
            ))}
          </div>
        ) : null}
        {directEvidence.length > 0 || groupEvidence.length > 0 ? (
          <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {directEvidence.map((crop) => (
              <span key={crop} style={directStyle}>
                ✓ {crop}の記載あり
              </span>
            ))}
            {directEvidence.length === 0
              ? groupEvidence.map((group) => (
                  <span key={group} style={groupStyle}>
                    {group}として記載
                  </span>
                ))
              : null}
          </div>
        ) : null}
      </div>
      <ChevronIcon />
    </Link>
  );
}
