"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { StarRating } from "@/components/star-rating";
import type { PostingMaterial } from "@/server/queries/materials";
import { css, cva } from "../../../styled-system/css";

const materialButton = cva({
  base: {
    w: "100%",
    display: "flex",
    alignItems: "center",
    gap: "3",
    p: "3",
    textAlign: "left",
    bg: "surface.card",
    color: "text.default",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "card",
    boxShadow: "shadow",
    cursor: "pointer",
  },
  variants: {
    selected: {
      true: { borderColor: "brand.primary", bg: "green.soft2" },
      false: { borderColor: "border.default" },
    },
  },
});

type MaterialPickerProps = {
  materials: PostingMaterial[];
  query: string;
};

export function MaterialPicker({ materials, query }: MaterialPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = materials.find(({ id }) => id === selectedId) ?? null;

  return (
    <>
      <p className={css({ m: "0", mb: "3", fontSize: "sm", color: "text.muted" })}>
        どの資材について書きますか？
      </p>

      <form method="get" className={css({ display: "flex", gap: "2" })}>
        <Input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={100}
          placeholder="資材名・メーカー名で検索"
          aria-label="資材名・メーカー名で検索"
        />
        <Button type="submit" size="sm">
          検索
        </Button>
      </form>

      <div
        className={css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "3" })}
        aria-live="polite"
      >
        {materials.length === 0 ? (
          <p
            className={css({
              m: "0",
              p: "4",
              bg: "surface.card",
              borderRadius: "card",
              color: "text.muted",
              fontSize: "sm",
              textAlign: "center",
            })}
          >
            条件に合う資材が見つかりませんでした。
          </p>
        ) : (
          materials.map((material) => (
            <button
              key={material.id}
              type="button"
              className={materialButton({ selected: material.id === selectedId })}
              aria-pressed={material.id === selectedId}
              onClick={() => setSelectedId(material.id)}
            >
              <span className={css({ flex: "1", minW: "0" })}>
                <span className={css({ display: "block", fontSize: "md", fontWeight: "700" })}>
                  {material.name}
                </span>
                <span
                  className={css({
                    display: "block",
                    mt: "0.5",
                    fontSize: "xs",
                    color: "text.muted",
                  })}
                >
                  {material.manufacturer_name}
                </span>
                <span
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5",
                    mt: "1.5",
                    fontSize: "xs",
                    color: "text.subtle",
                  })}
                >
                  <StarRating value={Math.round(material.avg_rating ?? 0)} />
                  レビュー {material.review_count}件
                </span>
              </span>
              <span
                className={css({
                  color: "brand.primary",
                  fontSize: "sm",
                  fontWeight: "700",
                  flexShrink: "0",
                })}
              >
                {material.id === selectedId ? "選択中" : "選ぶ"}
              </span>
            </button>
          ))
        )}
      </div>

      <p
        className={css({
          mt: "4",
          px: "3",
          py: "2.5",
          borderRadius: "pill",
          bg: "brand.soft",
          color: "brand.primaryDeep",
          fontSize: "xs",
          textAlign: "center",
        })}
      >
        資材ページの「書く」ボタンからも投稿できます
      </p>

      {selected === null ? null : (
        <div
          className={css({
            position: "fixed",
            left: "3",
            right: "3",
            bottom: "3",
            zIndex: "20",
            maxW: "md",
            mx: "auto",
            p: "3",
            display: "grid",
            gap: "2",
            bg: "card/94",
            backdropFilter: "blur(10px)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "card",
            boxShadow: "shadow.lift",
          })}
        >
          <p
            className={css({
              m: "0",
              mb: "1",
              fontSize: "sm",
              fontWeight: "700",
              color: "text.default",
            })}
          >
            {selected.name}
          </p>
          <Link
            href={`/materials/${selected.id}/report/new`}
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: "3",
              borderRadius: "button",
              bg: "brand.primary",
              color: "surface.card",
              fontSize: "md",
              fontWeight: "700",
              textDecoration: "none",
            })}
          >
            使用レポートを書く
          </Link>
          <Link
            href={`/materials/${selected.id}/review/new`}
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: "3",
              borderRadius: "button",
              bg: "surface.card",
              color: "brand.primary",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "border.strong",
              fontSize: "md",
              fontWeight: "700",
              textDecoration: "none",
            })}
          >
            レビューを書く
          </Link>
        </div>
      )}
    </>
  );
}
