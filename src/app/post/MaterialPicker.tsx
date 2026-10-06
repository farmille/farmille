"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/app/_mock/FormParts";
import { MockNoImage } from "@/app/materials/[id]/_components/MockParts";
import type { PostingMaterial } from "@/server/queries/materials";

type MaterialPickerProps = {
  materials: PostingMaterial[];
  query: string;
  postType?: "report" | "review";
};

/**
 * 見本 S.pickMaterial の `.body` と `.pick-footer`。
 * 検索は本番の仕組み（検索語を送って候補を取り直す）のまま、入力欄の見た目を見本の `.ts-box` にしている。
 */
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
            該当する資材がありません
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
              <span className="mat-img" style={{ width: 44, height: 44 }}>
                <MockNoImage />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="t-name" style={{ display: "block", fontSize: 13.5 }}>
                  {material.name}
                </span>
                <span className="muted" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
                  {material.manufacturer_name}
                </span>
              </span>
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
              }}
            >
              <MockNoImage />
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
