"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/Icon";
import type { ReviewCropOption } from "@/server/queries/reviews";
import { css } from "../../../../../../styled-system/css";

const searchBox = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  px: "3",
  py: "2.5",
  _focusWithin: {
    borderColor: "primary.600",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "primary.200",
  },
});

const searchInput = css({
  flex: "1",
  minW: "0",
  borderWidth: "0",
  outline: "none",
  bg: "transparent",
  color: "text.default",
  fontSize: "md",
  fontFamily: "sans",
  _placeholder: { color: "text.subtle" },
});

const selectedChips = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5",
  mt: "2",
  minH: "24px",
  alignItems: "center",
});

const selectedChip = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "pill",
  bg: "primary.soft",
  color: "primary.700",
  px: "2.5",
  py: "1",
  fontSize: "sm",
  fontWeight: "600",
});

const category = css({
  fontSize: "2xs",
  color: "text.subtle",
  fontWeight: "600",
});

const removeButton = css({
  borderWidth: "0",
  bg: "transparent",
  color: "inherit",
  p: "0",
  fontSize: "md",
  lineHeight: "1",
  cursor: "pointer",
});

const emptySelection = css({
  m: "0",
  fontSize: "sm",
  color: "text.subtle",
});

const selectionError = css({
  m: "0",
  fontSize: "sm",
  color: "accent.danger",
  fontWeight: "700",
});

const panel = css({
  mt: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  bg: "surface.card",
  boxShadow: "shadow",
  overflow: "hidden",
});

const panelHeading = css({
  px: "3",
  pt: "2.5",
  pb: "1",
  fontSize: "xs",
  fontWeight: "700",
  color: "text.subtle",
});

const suggestion = css({
  w: "100%",
  display: "flex",
  alignItems: "center",
  gap: "2",
  borderWidth: "0",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  bg: "surface.card",
  px: "3",
  py: "2.5",
  color: "text.default",
  textAlign: "left",
  cursor: "pointer",
  _hover: { bg: "primary.soft" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "-2px",
  },
});

const suggestionGroup = css({
  flexShrink: "0",
  borderRadius: "pill",
  bg: "surface.page",
  px: "2",
  py: "0.5",
  fontSize: "2xs",
  color: "text.subtle",
});

const suggestionAlias = css({
  ml: "auto",
  fontSize: "xs",
  color: "text.subtle",
});

const empty = css({
  px: "3",
  py: "3",
  fontSize: "sm",
  color: "text.subtle",
});

export function ReviewCropPicker({
  crops,
  selectedCropIds,
  error,
  onAdd,
  onRemove,
}: {
  crops: ReviewCropOption[];
  selectedCropIds: string[];
  error?: string;
  onAdd: (cropId: string) => void;
  onRemove: (cropId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedCropIds), [selectedCropIds]);
  const cropById = useMemo(() => new Map(crops.map((crop) => [crop.id, crop])), [crops]);
  const normalizedQuery = query.trim().toLocaleLowerCase("ja");
  const unselected = crops.filter((crop) => !selected.has(crop.id));
  const suggestions = unselected
    .filter(
      (crop) =>
        normalizedQuery.length === 0 ||
        crop.name.toLocaleLowerCase("ja").includes(normalizedQuery) ||
        crop.groupName.toLocaleLowerCase("ja").includes(normalizedQuery) ||
        crop.aliases.some((alias) => alias.toLocaleLowerCase("ja").includes(normalizedQuery)),
    )
    .slice(0, 9);
  const heading = normalizedQuery.length > 0 ? "検索結果" : "作物の候補";

  return (
    <>
      <div className={searchBox}>
        <Icon name="search" size="sm" />
        <input
          id="review-crop"
          aria-label="作目"
          aria-describedby="review-crop-selection"
          className={searchInput}
          value={query}
          placeholder="作物名を入力（例：みかん、デコポン）"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div id="review-crop-selection" className={selectedChips} aria-live="polite">
        {selectedCropIds.length > 0 ? (
          selectedCropIds.map((cropId) => {
            const crop = cropById.get(cropId);
            if (crop === undefined) return null;

            return (
              <span key={crop.id} className={selectedChip}>
                <input type="hidden" name="cropIds" value={crop.id} />
                <span className={category}>{crop.groupName}</span>
                {crop.name}
                <button
                  type="button"
                  className={removeButton}
                  aria-label={`${crop.name}を削除`}
                  onClick={() => onRemove(crop.id)}
                >
                  <Icon name="close" size="sm" />
                </button>
              </span>
            );
          })
        ) : error === undefined ? (
          <p className={emptySelection}>作目を1つ選んでください。</p>
        ) : (
          <p role="alert" className={selectionError}>
            {error}
          </p>
        )}
      </div>

      <div className={panel}>
        <div className={panelHeading}>{heading}</div>
        {suggestions.length > 0 ? (
          suggestions.map((crop) => {
            const matchingAlias = crop.aliases.find((alias) =>
              alias.toLocaleLowerCase("ja").includes(normalizedQuery),
            );

            return (
              <button
                key={crop.id}
                type="button"
                className={suggestion}
                aria-label={`${crop.name}を選択`}
                onClick={() => {
                  onAdd(crop.id);
                  setQuery("");
                }}
              >
                <span className={suggestionGroup}>{crop.groupName}</span>
                <span>{crop.name}</span>
                {normalizedQuery.length > 0 && matchingAlias !== undefined ? (
                  <span className={suggestionAlias}>別名：{matchingAlias}</span>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className={empty}>一致する作物がありません。</div>
        )}
      </div>
    </>
  );
}
