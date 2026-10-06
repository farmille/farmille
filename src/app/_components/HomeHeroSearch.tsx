"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { OptimizedImage as Image } from "@/components/OptimizedImage";

import type { HeroPillKind, HeroSearchOptions } from "./home-hero-options";

/** 見本のホーム検索窓の候補は資材6件まで。 */
const SUGGESTION_LIMIT = 6;

const PILLS: { kind: HeroPillKind; label: string; head: string }[] = [
  { kind: "crop", label: "作物", head: "作物分類" },
  { kind: "effect", label: "効果", head: "効果分類" },
  { kind: "genre", label: "資材ジャンル", head: "資材ジャンル（JBSA「BS製品の分類」）" },
  { kind: "maker", label: "メーカー", head: "掲載数の多いメーカー" },
];

const PILL_DROP_ID = "home-hero-pill-drop";

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

/** 見本の SEARCH_ICON。 */
function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

/**
 * 見本 S.home の写真ヒーロー右側（検索窓・資材名の候補・絞り込みピル）。
 * 送信は /search?q= へ（既存の HomeSearchEntry と同じ）。候補とピルは検索ページへのリンク。
 */
export function HomeHeroSearch({ options }: { options: HeroSearchOptions | null }) {
  const [query, setQuery] = useState("");
  const [openPill, setOpenPill] = useState<HeroPillKind | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const keyword = normalize(query);

  // ピルとドロップダウンの外側を押したら閉じる（スクロールでは閉じない）。
  useEffect(() => {
    if (openPill === null) return;
    const close = (event: Event) => {
      if (event.target instanceof Node && pillsRef.current?.contains(event.target)) return;
      setOpenPill(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPill(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openPill]);

  const hits = useMemo(() => {
    if (keyword.length === 0 || options === null) return [];
    return options.materials
      .filter(
        (material) =>
          normalize(material.name).includes(keyword) || normalize(material.maker).includes(keyword),
      )
      .slice(0, SUGGESTION_LIMIT);
  }, [keyword, options]);

  const pill = PILLS.find((item) => item.kind === openPill);
  const searchHref = `/search?${new URLSearchParams({ q: query.trim() }).toString()}`;

  return (
    <>
      <div className="hero-wrap">
        <Form action="/search" aria-label="資材検索" className="ts-box hero-search" role="search">
          <span className="ts-ic">
            <SearchIcon />
          </span>
          <input
            aria-label="資材を検索する。作物、悩み、資材名から探せます"
            autoComplete="off"
            className="ts-input"
            enterKeyHint="search"
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="資材名・メーカー・作物・悩みから探す"
            type="search"
            value={query}
          />
          <button className="go-arrow" type="submit" aria-label="検索">
            →
          </button>
        </Form>
        {keyword.length > 0 ? (
          <div className="hero-suggest">
            {hits.length > 0 ? (
              <>
                <div className="hs-head">資材</div>
                {hits.map((material) => (
                  <Link key={material.id} className="hs-row" href={`/materials/${material.id}`}>
                    <span className="thumb" aria-hidden="true">
                      {material.imageUrl ? (
                        <Image alt="" src={material.imageUrl} width={40} height={40} sizes="40px" />
                      ) : (
                        "NO IMAGE"
                      )}
                    </span>
                    <span>
                      <span className="nm">{material.name}</span>
                      <br />
                      <span className="mk">{material.maker}</span>
                    </span>
                    <span className="arr" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </>
            ) : null}
            <Link className="hs-foot" href={searchHref}>
              「{query.trim()}」で条件検索（作物・悩み） →
            </Link>
          </div>
        ) : null}
      </div>
      <div ref={pillsRef} className={keyword.length > 0 ? "hero-pills is-hidden" : "hero-pills"}>
        {PILLS.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={openPill === item.kind ? "hero-pill on" : "hero-pill"}
            aria-expanded={openPill === item.kind}
            aria-controls={openPill === item.kind ? PILL_DROP_ID : undefined}
            disabled={options === null}
            onClick={() => setOpenPill(openPill === item.kind ? null : item.kind)}
          >
            {item.label}{" "}
            <span className="pc" aria-hidden="true">
              ▾
            </span>
          </button>
        ))}
        {pill && options ? (
          <div className="pill-drop" id={PILL_DROP_ID}>
            <div className="pd-head">{pill.head}</div>
            {options.pills[pill.kind].map((row) => (
              <Link key={row.href} className="pd-row" href={row.href}>
                <span>{row.label}</span>
                <span className="pd-n tnum">{row.count}</span>
              </Link>
            ))}
            <Link className="pd-foot" href="/search">
              一覧を見る →
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
