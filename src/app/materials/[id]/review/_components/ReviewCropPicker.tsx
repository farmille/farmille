"use client";

import { useMemo, useState } from "react";

import { FieldError } from "@/app/_site/FormParts";
import { SearchCombobox } from "@/app/_site/SearchCombobox";
import type { ReviewCropOption } from "@/server/queries/reviews";

import { css } from "../../../../../../styled-system/css";

const chipStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  py: "1",
  pr: "1.5",
  pl: "3",
  bg: "primary.100",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.700/30",
  borderRadius: "pill",
  fontSize: "sm",
  fontWeight: "semibold",
  color: "primary.800",
});

const chipRemoveStyle = css({
  display: "grid",
  placeItems: "center",
  w: "4",
  h: "4",
  p: "0",
  bg: "primary.700/18",
  borderRadius: "pill",
  fontSize: "sm",
  lineHeight: "none",
  color: "primary.800",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "1px",
  },
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
  const shownError = selectedCropIds.length === 0 ? error : undefined;
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

  return (
    <>
      <SearchCombobox
        id="review-crop"
        aria-label="作目"
        aria-describedby={shownError === undefined ? "review-crop-selection" : "review-crop-error"}
        aria-invalid={shownError === undefined ? undefined : true}
        value={query}
        onValueChange={setQuery}
        placeholder="作物名を入力（例：みかん、デコポン）"
        options={suggestions.map((crop) => ({
          value: crop.id,
          label: crop.name,
          description: crop.groupName,
        }))}
        onSelect={(id) => {
          onAdd(id);
          setQuery("");
        }}
        emptyMessage="一致する作物がありません。"
      />

      <div
        id="review-crop-selection"
        className={css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "2.5" })}
        aria-live="polite"
      >
        {selectedCropIds.length > 0 ? (
          selectedCropIds.map((cropId) => {
            const crop = cropById.get(cropId);
            if (crop === undefined) return null;

            return (
              <span key={crop.id} className={chipStyle}>
                <input type="hidden" name="cropIds" value={crop.id} />
                <span
                  className={css({ fontSize: "2xs", fontWeight: "bold", color: "primary.800/65" })}
                >
                  {crop.groupName}
                </span>
                {crop.name}
                <button
                  className={chipRemoveStyle}
                  type="button"
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
            作目を1つ選んでください。
          </span>
        )}
      </div>
      <FieldError id="review-crop-error" message={shownError} />
    </>
  );
}
