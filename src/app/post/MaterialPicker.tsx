"use client";

import Link from "next/link";
import { useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { parseAsString, useQueryState } from "nuqs";

import { NoImage, Stars } from "@/app/materials/[id]/_components/CardParts";
import { buttonRecipe } from "@/components/Button";
import { SearchInput } from "@/components/form";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import type { PostingMaterialWithImage } from "@/server/queries/materials";

import { css, cx } from "../../../styled-system/css";

type MaterialPickerProps = {
  materials: PostingMaterialWithImage[];
  postType?: "report" | "review";
};

const focusRing = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary.700",
  outlineOffset: "0.5",
} as const;

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
  color: "[inherit]",
  textAlign: "left",
  cursor: "pointer",
  _pressed: { borderColor: "primary.700", bg: "primary.soft" },
  _focusVisible: focusRing,
});

const pickRingStyle = css({
  flex: "none",
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
  flex: "none",
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
  zIndex: "fixedBar",
  mt: "3.5",
  mx: "-4",
  pt: "3.5",
  px: "4",
  pb: "[calc(token(spacing.4) + env(safe-area-inset-bottom, 0px))]",
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

export function MaterialPicker({ materials, postType }: MaterialPickerProps) {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false, history: "push", scroll: false }),
  );

  return (
    <MaterialPickerBody
      key={query}
      materials={materials}
      onSearch={(query) => void setQuery(query || null)}
      postType={postType}
      query={query}
    />
  );
}

function MaterialPickerBody({
  materials,
  query,
  postType,
  onSearch,
}: MaterialPickerProps & { query: string; onSearch: (query: string) => void }) {
  const form = useForm({
    defaultValues: { query },
    onSubmit: ({ value }) => onSearch(value.query.trim()),
  });

  const input = useStore(form.store, (state) => state.values.query);

  const [selectedId, setSelectedId] = useReducer(
    (_state: string | null, next: string | null) => next,
    null,
  );

  const selected = materials.find(({ id }) => id === selectedId) ?? null;

  return (
    <>
      <p className={css({ mb: "3", textStyle: "supporting", color: "text.subtle" })}>
        どの資材について書きますか？
      </p>

      <form
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          setSelectedId(null);
          void form.handleSubmit();
        }}
        role="search"
      >
        {postType !== undefined ? <input type="hidden" name="type" value={postType} /> : null}
        <SearchInput
          aria-label="資材名・メーカー名で検索"
          maxLength={100}
          name="q"
          onValueChange={(value) => form.setFieldValue("query", value)}
          placeholder="資材名・メーカー名で検索"
          submitLabel="検索"
          value={input}
        />
      </form>

      <div
        className={css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "3" })}
        aria-live="polite"
      >
        {materials.length === 0 ? (
          <div
            className={cx(
              surfaceCardRecipe({ padding: "cozy" }),
              css({ textAlign: "center", textStyle: "supporting", color: "text.subtle" }),
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
                <span className={css({ display: "block", textStyle: "body", fontWeight: "bold" })}>
                  {material.name}
                </span>
                <span
                  className={css({
                    display: "block",
                    mt: "0.5",
                    textStyle: "note",
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
                      textStyle: "note",
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
                    flex: "none",
                    fontSize: "sm",
                    fontWeight: "bold",
                    color: "text.brandOnSoft",
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
          textStyle: "note",
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
              textStyle: "body",
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
                  textStyle: "note",
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
