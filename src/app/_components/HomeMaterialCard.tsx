import Link from "next/link";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { MockNoImage } from "@/app/materials/[id]/_components/MockParts";

type HomeMaterialCardProps = {
  href: string;
  name: string;
  maker: string;
  /** 感想口コミが無い資材は null。 */
  rating: number | null;
  reviewCount: number;
  /** 集計が取れない資材は null（「−」で出す）。 */
  reportCount: number | null;
  savedCount: number | null;
  categories: string[];
  imageSrc?: string | null;
};

const ratingStyle = { color: "var(--amber)", fontWeight: 700 } as const;
const nowrap = { whiteSpace: "nowrap" } as const;

/** 見本 S.home の掲載資材一覧のカード（`.pm-card`）。 */
export function HomeMaterialCard({
  href,
  name,
  maker,
  rating,
  reviewCount,
  reportCount,
  savedCount,
  categories,
  imageSrc,
}: HomeMaterialCardProps) {
  const hasReports = reportCount !== null && reportCount > 0;
  return (
    <Link className="pm-card" href={href} draggable={false}>
      <div className="img">
        {imageSrc ? (
          <Image alt="" src={imageSrc} width={168} height={140} sizes="190px" draggable={false} />
        ) : (
          <MockNoImage />
        )}
      </div>
      <div className="info">
        <div className="mk">{maker}</div>
        <div className="nm">{name}</div>
        <div className="cnt" style={ratingStyle}>
          ★ <span className="tnum">{rating === null ? "−" : rating.toFixed(1)}</span>{" "}
          <span className="muted" style={{ fontWeight: 400 }}>
            ({reviewCount})
          </span>
        </div>
        <div className="cnt">
          <span style={nowrap}>
            実証詳細レポート{" "}
            <b
              className="tnum"
              style={
                hasReports
                  ? { color: "var(--amber)", fontSize: "1.2em" }
                  : { color: "inherit", fontSize: "1em" }
              }
            >
              {reportCount ?? "−"}
            </b>
            件
          </span>{" "}
          <span style={nowrap}>
            ・ <span style={{ color: "var(--green-deep)" }}>★</span> お気に入り{" "}
            <b className="tnum">{savedCount ?? "−"}</b>
          </span>
        </div>
        <div className="ef">
          {categories.map((category) => (
            <span key={category} className="pm-tag">
              {category}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
