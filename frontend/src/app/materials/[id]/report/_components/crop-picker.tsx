"use client";

import { useMemo, useState } from "react";

import { cva, css } from "../../../../../../styled-system/css";
import { SearchIcon } from "@/components/icons";
import type { CropOption } from "@/server/queries/usage-report-form";

import { FieldError, FieldLabel, formStyles } from "./form-ui";

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
    borderColor: "brand.primary",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "brand.soft",
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
  minH: "6",
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
  bg: "brand.soft",
  color: "brand.primaryDeep",
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
  _hover: { bg: "green.soft2" },
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

const tabsGuide = css({
  mt: "4",
  mb: "2",
  fontSize: "sm",
  color: "text.muted",
  lineHeight: "1.55",
});

const tabBar = css({
  display: "flex",
  gap: "1",
  overflowX: "auto",
  scrollbarWidth: "none",
  px: "0.5",
  position: "relative",
  zIndex: "1",
  mb: "-1px",
});

const cropTab = cva({
  base: {
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "button",
    borderBottomLeftRadius: "0",
    borderBottomRightRadius: "0",
    px: "3",
    py: "2.5",
    fontSize: "sm",
  },
  variants: {
    selected: {
      true: {
        bg: "surface.card",
        borderBottomColor: "surface.card",
        color: "text.default",
        fontWeight: "800",
      },
      false: {
        bg: "surface.page",
        color: "text.muted",
        fontWeight: "600",
      },
    },
  },
});

const tabSelect = css({
  borderWidth: "0",
  bg: "transparent",
  color: "inherit",
  px: "3",
  py: "2.5",
  font: "inherit",
  fontWeight: "inherit",
  cursor: "pointer",
});

const tabRemove = css({
  w: "5",
  h: "5",
  display: "grid",
  placeItems: "center",
  borderWidth: "0",
  borderRadius: "pill",
  bg: "transparent",
  color: "text.subtle",
  p: "0",
  cursor: "pointer",
});

export function CropPicker({
  crops,
  selectedCropIds,
  activeCropId,
  onAdd,
  onRemove,
  onActivate,
  error,
}: {
  crops: CropOption[];
  selectedCropIds: string[];
  activeCropId: string | null;
  onAdd: (cropId: string) => void;
  onRemove: (cropId: string) => void;
  onActivate: (cropId: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedCropIds), [selectedCropIds]);
  const cropById = useMemo(() => new Map(crops.map((crop) => [crop.id, crop])), [crops]);
  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    return crops
      .filter((crop) => !selected.has(crop.id))
      .filter(
        (crop) =>
          normalizedQuery.length === 0 ||
          crop.name.toLocaleLowerCase("ja").includes(normalizedQuery) ||
          crop.groupName.toLocaleLowerCase("ja").includes(normalizedQuery) ||
          crop.aliases.some((alias) => alias.toLocaleLowerCase("ja").includes(normalizedQuery)),
      )
      .slice(0, 9);
  }, [crops, query, selected]);

  return (
    <div className={formStyles.field}>
      <FieldLabel required htmlFor="crop-search">
        使用作物
      </FieldLabel>
      <div className={searchBox}>
        <SearchIcon />
        <input
          id="crop-search"
          className={searchInput}
          value={query}
          placeholder="作物名を入力（例：みかん、デコポン）"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className={selectedChips}>
        {selectedCropIds.length > 0 ? (
          selectedCropIds.map((cropId) => {
            const crop = cropById.get(cropId);
            if (crop === undefined) return null;
            return (
              <span key={crop.id} className={selectedChip}>
                <span className={category}>{crop.groupName}</span>
                {crop.name}
                <button
                  type="button"
                  className={removeButton}
                  aria-label={`${crop.name}を削除`}
                  onClick={() => onRemove(crop.id)}
                >
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <span className={css({ fontSize: "sm", color: "text.subtle" })}>
            作物を1つ以上選んでください
          </span>
        )}
      </div>
      <div className={panel}>
        <div className={panelHeading}>{query.trim().length === 0 ? "作物の候補" : "検索結果"}</div>
        {suggestions.length > 0 ? (
          suggestions.map((crop) => {
            const matchingAlias = crop.aliases.find((alias) =>
              alias.toLocaleLowerCase("ja").includes(query.trim().toLocaleLowerCase("ja")),
            );
            return (
              <button
                key={crop.id}
                type="button"
                className={suggestion}
                onClick={() => {
                  onAdd(crop.id);
                  setQuery("");
                }}
              >
                <span className={suggestionGroup}>{crop.groupName}</span>
                <span>{crop.name}</span>
                {matchingAlias ? (
                  <span className={suggestionAlias}>別名：{matchingAlias}</span>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className={empty}>一致する作物がありません。</div>
        )}
      </div>
      <FieldError message={error} />

      {selectedCropIds.length >= 2 ? (
        <>
          <p className={tabsGuide}>
            以下の項目は作物ごとに入力できます。作物名のタブで切り替えてください。
          </p>
          <div className={tabBar} role="tablist" aria-label="作物ごとの入力">
            {selectedCropIds.map((cropId) => {
              const crop = cropById.get(cropId);
              if (crop === undefined) return null;
              return (
                <div key={crop.id} className={cropTab({ selected: crop.id === activeCropId })}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={crop.id === activeCropId}
                    className={tabSelect}
                    onClick={() => onActivate(crop.id)}
                  >
                    {crop.name}
                  </button>
                  <button
                    type="button"
                    className={tabRemove}
                    aria-label={`${crop.name}を削除`}
                    onClick={() => onRemove(crop.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
