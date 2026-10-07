"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { css, cva, cx } from "../../../styled-system/css";

import type { HeroPillKind, HeroSearchOptions } from "./home-hero-options";

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

const wrapStyle = css({
  position: "relative",
  zIndex: "1",
  w: "full",
  maxW: "calc(token(sizes.96) + token(sizes.44))",
});

const formStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  py: "3.5",
  pr: "2",
  pl: "4.5",
  bg: "text.inverse/14",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "text.inverse/55",
  borderRadius: "pill",
  backdropFilter: "blur(token(blurs.reportGate))",
  tab: { py: "5", pr: "3", pl: "6.5" },
});

const inputStyle = css({
  flex: "1",
  minW: "0",
  borderWidth: "0",
  bg: "transparent",
  color: "text.inverse",
  fontSize: "md",
  fontWeight: "bold",
  outline: "none",
  _placeholder: { color: "text.inverse/95" },
  "&::-webkit-search-cancel-button, &::-webkit-search-decoration": { display: "none" },
  tab: { fontSize: "lg" },
});

const submitStyle = css({
  flex: "none",
  display: "grid",
  placeItems: "center",
  w: "10",
  h: "10",
  p: "0",
  borderWidth: "0",
  borderRadius: "pill",
  bg: "primary.700",
  color: "text.inverse",
  fontSize: "lg",
  cursor: "pointer",
  tab: { w: "11", h: "11" },
});

const dropdownStyle = css({
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "banner",
  boxShadow: "shadow.lift",
  overflow: "hidden",
});

const suggestStyle = css({
  position: "absolute",
  left: "0",
  right: "0",
  top: "calc(100% + token(spacing.2))",
  zIndex: "40",
});

const dropdownHeadStyle = css({
  color: "text.subtle",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "0.08em",
});

const hoverRow = css.raw({
  color: "inherit",
  textDecoration: "none",
  _hover: { bg: "primary.soft" },
});

const suggestRowStyle = css(hoverRow, {
  display: "flex",
  alignItems: "center",
  gap: "3",
  py: "2.5",
  px: "4",
});

const thumbStyle = css({
  flex: "none",
  display: "grid",
  placeItems: "center",
  w: "10",
  h: "10",
  overflow: "hidden",
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  color: "text.subtle",
  fontSize: "2xs",
  letterSpacing: "0.05em",
  "& img": {
    w: "full",
    h: "full",
    objectFit: "contain",
    borderRadius: "inherit",
    bg: "surface.card",
  },
});

const footLinkStyle = css(hoverRow, {
  display: "block",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  color: "primary.700",
  fontSize: "sm",
  fontWeight: "bold",
});

const pillsRecipe = cva({
  base: {
    position: "relative",
    zIndex: "1",
    display: "flex",
    flexWrap: "wrap",
    gap: "2.5",
    mt: "3.5",
    tab: { w: "full", maxW: "calc(token(sizes.96) + token(sizes.44))" },
  },
  variants: { hidden: { true: { visibility: "hidden" }, false: {} } },
});

const pillRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    py: "2",
    px: "4",
    bg: "scrim/22",
    color: "text.inverse/90",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "text.inverse/35",
    borderRadius: "pill",
    backdropFilter: "blur(token(blurs.reportGate))",
    fontSize: "sm",
    whiteSpace: "nowrap",
    cursor: "pointer",
    _hover: { bg: "text.inverse/22", borderColor: "text.inverse/70", color: "text.inverse" },
  },
  variants: {
    open: {
      true: {
        bg: "text.inverse/22",
        borderColor: "text.inverse/70",
        color: "text.inverse",
        fontWeight: "bold",
      },
      false: {},
    },
  },
});

const pillCaretStyle = css({ color: "text.inverse/70" });

const pillDropStyle = css({
  position: "absolute",
  top: "calc(100% + token(spacing.2.5))",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: "50",
  w: "min(token(sizes.96), calc(100vw - token(spacing.8)))",
  textAlign: "left",
});

const pillRowStyle = css(hoverRow, {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "5",
  py: "3",
  px: "5.5",
  fontSize: "md",
});

const countStyle = css({
  color: "text.default",
  fontSize: "sm",
  fontWeight: "bold",
  fontVariantNumeric: "tabular-nums",
});

export function HomeHeroSearch({ options }: { options: HeroSearchOptions | null }) {
  const [query, setQuery] = useState("");
  const [openPill, setOpenPill] = useState<HeroPillKind | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const keyword = normalize(query);

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
      <div className={wrapStyle}>
        <Form action="/search" aria-label="資材検索" className={formStyle} role="search">
          <span className={css({ display: "flex", color: "text.inverse" })}>
            <SearchIcon />
          </span>
          <input
            aria-label="資材を検索する。作物、悩み、資材名から探せます"
            autoComplete="off"
            className={inputStyle}
            enterKeyHint="search"
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="資材名・メーカー・作物・悩みから探す"
            type="search"
            value={query}
          />
          <button className={submitStyle} type="submit" aria-label="検索">
            →
          </button>
        </Form>
        {keyword.length > 0 ? (
          <div className={cx(dropdownStyle, suggestStyle)}>
            {hits.length > 0 ? (
              <>
                <div className={cx(dropdownHeadStyle, css({ pt: "3", px: "4", pb: "1" }))}>
                  資材
                </div>
                {hits.map((material) => (
                  <Link
                    key={material.id}
                    className={suggestRowStyle}
                    href={`/materials/${material.id}`}
                  >
                    <span className={thumbStyle} aria-hidden="true">
                      {material.imageUrl ? (
                        <Image alt="" src={material.imageUrl} width={40} height={40} sizes="40px" />
                      ) : (
                        "NO IMAGE"
                      )}
                    </span>
                    <span>
                      <span
                        className={css({ fontSize: "md", fontWeight: "bold", lineHeight: "tight" })}
                      >
                        {material.name}
                      </span>
                      <br />
                      <span className={css({ fontSize: "xs", color: "text.subtle" })}>
                        {material.maker}
                      </span>
                    </span>
                    <span className={css({ ml: "auto", color: "text.subtle" })} aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </>
            ) : null}
            <Link className={cx(footLinkStyle, css({ py: "3", px: "4" }))} href={searchHref}>
              「{query.trim()}」で条件検索（作物・悩み） →
            </Link>
          </div>
        ) : null}
      </div>
      <div ref={pillsRef} className={pillsRecipe({ hidden: keyword.length > 0 })}>
        {PILLS.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={pillRecipe({ open: openPill === item.kind })}
            aria-expanded={openPill === item.kind}
            aria-controls={openPill === item.kind ? PILL_DROP_ID : undefined}
            disabled={options === null}
            onClick={() => setOpenPill(openPill === item.kind ? null : item.kind)}
          >
            {item.label}{" "}
            <span className={pillCaretStyle} aria-hidden="true">
              ▾
            </span>
          </button>
        ))}
        {pill && options ? (
          <div className={cx(dropdownStyle, pillDropStyle)} id={PILL_DROP_ID}>
            <div className={cx(dropdownHeadStyle, css({ pt: "3.5", px: "5.5", pb: "2" }))}>
              {pill.head}
            </div>
            {options.pills[pill.kind].map((row) => (
              <Link key={row.href} className={pillRowStyle} href={row.href}>
                <span>{row.label}</span>
                <span className={countStyle}>{row.count}</span>
              </Link>
            ))}
            <Link className={cx(footLinkStyle, css({ py: "3", px: "5.5" }))} href="/search">
              一覧を見る →
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
