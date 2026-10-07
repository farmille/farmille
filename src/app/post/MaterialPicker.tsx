"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/app/_site/FormParts";
import { NoImage, Stars } from "@/app/materials/[id]/_components/CardParts";
import { buttonRecipe } from "@/components/Button";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import type { PostingMaterialWithImage } from "@/server/queries/materials";

import { css, cx } from "../../../styled-system/css";

type MaterialPickerProps = {
  materials: PostingMaterialWithImage[];
  query: string;
  postType?: "report" | "review";
};

const focusRing = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary.700",
  outlineOffset: "2px",
} as const;

const searchBoxStyle = css({
  display: "flex",
  flex: "1",
  alignItems: "center",
  gap: "2",
  minW: "0",
  px: "3",
  py: "2.5",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  _focusWithin: {
    borderColor: "primary.700",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "primary.700/16",
  },
});

const searchInputStyle = css({
  flex: "1",
  minW: "0",
  bg: "transparent",
  fontSize: "md",
  color: "text.default",
  outline: "none",
  _placeholder: { color: "text.subtle" },
});

const searchButtonStyle = css(buttonRecipe.raw({ variant: "primary", size: "sm" }), {
  flex: "0 0 auto",
  minW: "0",
  px: "4",
});

const pickRowStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  w: "full",
  p: "3",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
  _pressed: { borderColor: "primary.700", bg: "primary.soft" },
  _focusVisible: focusRing,
});

const pickRingStyle = css({
  flex: "0 0 auto",
  w: "4.5",
  h: "4.5",
  p: "0.5",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "pill",
  backgroundClip: "content-box",
  "[aria-pressed=true] > &": { borderColor: "primary.700", bgColor: "primary.700" },
});

const thumbRecipeBase = {
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  overflow: "hidden",
  borderRadius: "media",
} as const;

const rowThumbStyle = css(thumbRecipeBase, { w: "11", h: "11", bg: "primary.soft" });

const footerThumbStyle = css(thumbRecipeBase, {
  w: "10",
  h: "10",
  p: "0.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
});

const footerStyle = css({
  position: "sticky",
  bottom: "0",
  zIndex: "20",
  mt: "3.5",
  mx: "-4",
  pt: "3.5",
  px: "4",
  pb: "calc(token(spacing.4) + env(safe-area-inset-bottom, 0px))",
  bg: "surface.card",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  borderTopRadius: "banner",
  boxShadow: "shadow.lift",
  tab: {
    w: "full",
    maxW: "content.workspace",
    mx: "0",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "banner",
  },
});

const reportLinkStyle = buttonRecipe({ variant: "primary" });
const reviewLinkStyle = buttonRecipe({ variant: "ghost" });

const footerGuideStyle = css({
  mt: "1",
  fontSize: "sm",
  lineHeight: "normal",
  color: "text.muted",
  textAlign: "center",
});

function MaterialThumb({ src, size }: { src: string | null; size: number }) {
  return src ? (
    <Image
      alt=""
      className={css({ w: "auto", h: "auto", maxW: "full", maxH: "full", objectFit: "contain" })}
      src={src}
      width={size * 2}
      height={size * 2}
      sizes={`${size}px`}
    />
  ) : (
    <NoImage />
  );
}

export function MaterialPicker({ materials, query, postType }: MaterialPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = materials.find(({ id }) => id === selectedId) ?? null;

  return (
    <>
      <p className={css({ mb: "3", fontSize: "sm", color: "text.subtle" })}>
        どの資材について書きますか？
      </p>

      <form
        method="get"
        className={css({ display: "flex", alignItems: "center", gap: "2" })}
        role="search"
      >
        {postType !== undefined ? <input type="hidden" name="type" value={postType} /> : null}
        <div className={searchBoxStyle}>
          <span className={css({ display: "flex", color: "text.subtle" })}>
            <SearchIcon />
          </span>
          <input
            id="pickInput"
            className={searchInputStyle}
            type="search"
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder="資材名・メーカー名で検索"
            aria-label="資材名・メーカー名で検索"
            autoComplete="off"
          />
        </div>
        <button type="submit" className={searchButtonStyle}>
          検索
        </button>
      </form>

      <div
        className={css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "3" })}
        aria-live="polite"
      >
        {materials.length === 0 ? (
          <div
            className={cx(
              surfaceCardRecipe({ padding: "cozy" }),
              css({ textAlign: "center", fontSize: "sm", color: "text.subtle" }),
            )}
          >
            条件に合う資材が見つかりませんでした。
          </div>
        ) : (
          materials.map((material) => (
            <button
              key={material.id}
              type="button"
              className={pickRowStyle}
              aria-label={`${material.name}を選択`}
              aria-pressed={material.id === selectedId}
              onClick={() => setSelectedId(material.id)}
            >
              <span className={pickRingStyle} aria-hidden="true" />
              <span className={rowThumbStyle}>
                <MaterialThumb src={material.imageUrl} size={44} />
              </span>
              <span className={css({ flex: "1", minW: "0" })}>
                <span className={css({ display: "block", fontSize: "md", fontWeight: "bold" })}>
                  {material.name}
                </span>
                <span
                  className={css({
                    display: "block",
                    mt: "0.5",
                    fontSize: "xs",
                    color: "text.subtle",
                  })}
                >
                  {material.manufacturer_name}
                </span>
                {material.review_count > 0 ? (
                  <span
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1",
                      mt: "1",
                      fontSize: "xs",
                      color: "text.subtle",
                    })}
                  >
                    <Stars value={material.avg_rating ?? 0} />
                    {material.avg_rating === null ? null : (
                      <b
                        className={css({
                          color: "text.default",
                          fontVariantNumeric: "tabular-nums",
                        })}
                      >
                        {material.avg_rating.toFixed(1)}
                      </b>
                    )}
                    <span>感想口コミ {material.review_count}件</span>
                  </span>
                ) : null}
              </span>
              {material.id === selectedId ? (
                <span
                  className={css({
                    flex: "0 0 auto",
                    fontSize: "sm",
                    fontWeight: "bold",
                    color: "primary.700",
                  })}
                >
                  選択中
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
      <div
        className={css({
          display: "inline-flex",
          alignItems: "center",
          gap: "1.5",
          mt: "3.5",
          px: "2.5",
          py: "0.5",
          bg: "surface.page",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "pill",
          fontSize: "xs",
          color: "text.subtle",
        })}
      >
        資材ページの「書く」ボタンからも投稿できます
      </div>

      {selected === null ? null : (
        <div className={footerStyle} data-ui="responsive-post-actions">
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              mb: "2.5",
              fontSize: "md",
              fontWeight: "bold",
            })}
          >
            <span className={footerThumbStyle}>
              <MaterialThumb src={selected.imageUrl} size={42} />
            </span>
            <span className={css({ minW: "0" })}>
              <span className={css({ display: "block", truncate: true })}>{selected.name}</span>
              <span
                className={css({
                  display: "block",
                  fontSize: "xs",
                  fontWeight: "normal",
                  color: "text.subtle",
                })}
              >
                {selected.manufacturer_name}
              </span>
            </span>
          </div>
          {postType !== "review" ? (
            <>
              <Link className={reportLinkStyle} href={`/materials/${selected.id}/report/new`}>
                実証詳細レポートを書く
              </Link>
              <div className={cx(footerGuideStyle, css({ mb: "2" }))}>
                対照区を設けた、詳しい体験の共有です
              </div>
            </>
          ) : null}
          {postType !== "report" ? (
            <>
              <Link className={reviewLinkStyle} href={`/materials/${selected.id}/review/new`}>
                感想口コミを書く
              </Link>
              <div className={footerGuideStyle}>
                星5段階の評価とコメント・写真で、気軽に体験を共有できます
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
