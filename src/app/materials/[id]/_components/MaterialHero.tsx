import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import type { ReactNode } from "react";

import type { MaterialDetail } from "@/server/queries/materials";

import type { SaveControlState } from "../actions";
import { MockChip, MockNoImage, MockStars } from "./MockParts";
import { SaveControl } from "./SaveControl";

/** 見本の追加画像サムネイル（34px）の枠。 */
const thumbStyle = {
  width: 34,
  height: 34,
  border: "1px solid var(--line)",
  borderRadius: 7,
  background: "var(--bg)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
} as const;

type MaterialHeroProps = {
  material: MaterialDetail;
  saved: boolean | null;
  toggleAction?: (previous: SaveControlState, formData: FormData) => Promise<SaveControlState>;
  saveUnavailable?: boolean;
  /** 実証詳細レポートの件数（読み込み中は Suspense の代替表示が入る）。 */
  reportCount?: ReactNode;
};

/** 見本 S.material の `.card.mat-hero`。 */
export function MaterialHero({
  material,
  saved,
  toggleAction,
  saveUnavailable,
  reportCount = <b className="tnum">−件</b>,
}: MaterialHeroProps) {
  const primaryImage = material.images[0];
  const extraImages = material.images.slice(1);
  const hasReviews = material.review_count > 0 && material.avg_rating !== null;
  const makerStyle = {
    marginTop: 5,
    color: "var(--green)",
    textDecoration: "underline",
    textDecorationColor: "color-mix(in srgb,var(--green) 40%,transparent)",
  } as const;

  return (
    <section className="card mat-hero" aria-labelledby="material-name">
      <div style={{ flex: "0 0 auto" }}>
        <div className="mat-hero-img" data-ui="material-hero-image">
          <MockNoImage className="mat-hero-placeholder" />
          {primaryImage ? (
            <Image
              alt={material.name}
              className="mat-hero-photo"
              height={170}
              preload
              sizes="(min-width: 900px) 170px, 118px"
              src={primaryImage.url}
              width={170}
            />
          ) : null}
        </div>
        {extraImages.length > 0 ? (
          <div aria-label="追加の製品画像" style={{ display: "flex", gap: 5, marginTop: 6 }}>
            {extraImages.slice(0, 3).map((image, index) => (
              <div key={image.id} style={thumbStyle}>
                <Image
                  src={image.url}
                  alt={`${material.name}の製品画像${index + 2}`}
                  width={68}
                  height={68}
                  sizes="34px"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
            ))}
            {extraImages.length > 3 ? (
              <div
                style={{
                  ...thumbStyle,
                  border: "none",
                  background: "none",
                  fontSize: 10,
                  color: "var(--ink-3)",
                }}
              >
                +{extraImages.length - 3}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 id="material-name" style={{ fontSize: 17 }}>
          {material.name}
        </h1>
        {hasReviews ? (
          <div style={{ marginTop: 4, color: "var(--amber)", fontWeight: 800, fontSize: 14 }}>
            <MockStars value={material.avg_rating ?? 0} />{" "}
            <span className="tnum">{material.avg_rating?.toFixed(1)}</span>
          </div>
        ) : null}
        {material.representativeSeller ? (
          <Link
            href={`/sellers/${material.representativeSeller.id}`}
            className="mat-maker"
            style={makerStyle}
          >
            {material.representativeSeller.official_name}
          </Link>
        ) : (
          <div className="mat-maker" style={{ marginTop: 5 }}>
            {material.manufacturer_name}
          </div>
        )}
        <div className="muted" style={{ fontSize: 10.5, marginTop: 3, lineHeight: 1.6 }}>
          国内での販売を代表する立場にあるとFarmille運営が調査・認識した企業を表示しています。相違がある場合は、
          <Link
            href="/sellers/apply"
            style={{ color: "var(--green-deep)", fontWeight: 600, textDecoration: "none" }}
          >
            メーカー登録
          </Link>
          からご連絡ください。
        </div>
        {material.ingredientCategories.length > 0 ? (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[...new Set(material.ingredientCategories.map(({ name }) => name))].map((name) => (
              <MockChip key={name}>{name}</MockChip>
            ))}
          </div>
        ) : null}
        <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          <a href="#anchorReports" style={{ whiteSpace: "nowrap", color: "inherit" }}>
            実証詳細レポート {reportCount}
          </a>{" "}
          <a
            href="#anchorReviews"
            style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "inherit" }}
          >
            ・ 感想口コミ <b className="tnum">{material.review_count}件</b>
          </a>{" "}
          <span style={{ fontSize: 10.5, whiteSpace: "nowrap" }}>
            ・ <span style={{ color: "var(--green-deep)" }}>★</span> お気に入り{" "}
            <b className="tnum">−</b>
          </span>
        </div>
        <SaveControl
          materialId={material.id}
          materialPath={`/materials/${material.id}`}
          saved={saved}
          toggleAction={toggleAction}
          unavailable={saveUnavailable}
        />
      </div>
    </section>
  );
}
