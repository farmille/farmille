"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/app/_mock/FormParts";
import { MockNoImage, MockStars } from "@/app/materials/[id]/_components/MockParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import type { PostingMaterialWithImage } from "@/server/queries/materials";

type MaterialPickerProps = {
  materials: PostingMaterialWithImage[];
  query: string;
  postType?: "report" | "review";
};

/**
 * 見本 S.pickMaterial の `.body` と `.pick-footer`。
 * 検索は本番の仕組み（検索語を送って候補を取り直す）のまま、入力欄の見た目を見本の `.ts-box` にしている。
 * 行には本番どおり★平均・感想口コミ件数と「選択中」を出し、資材画像があれば画像、無いときだけ見本の NO IMAGE を出す。
 */
function MaterialThumb({ src, size }: { src: string | null; size: number }) {
  return src ? (
    <Image
      alt=""
      src={src}
      width={size * 2}
      height={size * 2}
      sizes={`${size}px`}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        objectFit: "contain",
      }}
    />
  ) : (
    <MockNoImage />
  );
}

export function MaterialPicker({ materials, query, postType }: MaterialPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = materials.find(({ id }) => id === selectedId) ?? null;

  return (
    <>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        どの資材について書きますか？
      </p>

      <form method="get" className="pick-search" role="search">
        {postType !== undefined ? <input type="hidden" name="type" value={postType} /> : null}
        <div className="ts-box">
          <span className="ts-ic">
            <SearchIcon />
          </span>
          <input
            id="pickInput"
            className="ts-input"
            type="search"
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder="資材名・メーカー名で検索"
            aria-label="資材名・メーカー名で検索"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          検索
        </button>
      </form>

      <div className="stack" style={{ marginTop: 12 }} aria-live="polite">
        {materials.length === 0 ? (
          <div
            className="card pad"
            style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}
          >
            条件に合う資材が見つかりませんでした。
          </div>
        ) : (
          materials.map((material) => (
            <button
              key={material.id}
              type="button"
              className={material.id === selectedId ? "pick-row sel" : "pick-row"}
              aria-label={`${material.name}を選択`}
              aria-pressed={material.id === selectedId}
              onClick={() => setSelectedId(material.id)}
            >
              <span className="ring" aria-hidden="true" />
              <span
                className="mat-img"
                style={{ width: 44, height: 44, flex: "0 0 auto", overflow: "hidden" }}
              >
                <MaterialThumb src={material.imageUrl} size={44} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="t-name" style={{ display: "block", fontSize: 13.5 }}>
                  {material.name}
                </span>
                <span className="muted" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
                  {material.manufacturer_name}
                </span>
                {material.review_count > 0 ? (
                  <span
                    className="muted"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexWrap: "wrap",
                      fontSize: 11,
                      marginTop: 3,
                    }}
                  >
                    <MockStars value={material.avg_rating ?? 0} />
                    {material.avg_rating === null ? null : (
                      <b className="tnum" style={{ color: "var(--ink)" }}>
                        {material.avg_rating.toFixed(1)}
                      </b>
                    )}
                    <span>感想口コミ {material.review_count}件</span>
                  </span>
                ) : null}
              </span>
              {material.id === selectedId ? (
                <span
                  style={{
                    flex: "0 0 auto",
                    color: "var(--green)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  選択中
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
      <div className="hint-pill" style={{ marginTop: 14 }}>
        資材ページの「書く」ボタンからも投稿できます
      </div>

      {selected === null ? null : (
        <div className="pick-footer" data-ui="responsive-post-actions">
          <div className="pf-name">
            <span
              className="mat-img"
              style={{
                width: 42,
                height: 42,
                flex: "0 0 auto",
                background: "#fff",
                border: "1px solid var(--line)",
                padding: 3,
                overflow: "hidden",
              }}
            >
              <MaterialThumb src={selected.imageUrl} size={42} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selected.name}
              </span>
              <span
                className="muted"
                style={{ display: "block", fontSize: 11, fontWeight: 400, marginTop: 1 }}
              >
                {selected.manufacturer_name}
              </span>
            </span>
          </div>
          {postType !== "review" ? (
            <>
              <Link className="btn btn-primary" href={`/materials/${selected.id}/report/new`}>
                実証詳細レポートを書く
              </Link>
              <div className="fguide" style={{ textAlign: "center", margin: "5px 0 7px" }}>
                対照区を設けた、詳しい体験の共有です
              </div>
            </>
          ) : null}
          {postType !== "report" ? (
            <>
              <Link className="btn btn-ghost" href={`/materials/${selected.id}/review/new`}>
                感想口コミを書く
              </Link>
              <div className="fguide" style={{ textAlign: "center", margin: "5px 0 0" }}>
                星5段階の評価とコメント・写真で、気軽に体験を共有できます
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
