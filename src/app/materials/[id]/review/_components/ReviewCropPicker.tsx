"use client";

import { useMemo, useState } from "react";

import { Combobox } from "@/components/Combobox";
import { TagChip } from "@/components/TagChip";
import type { ReviewCropOption } from "@/server/queries/reviews";
import { css } from "../../../../../../styled-system/css";

const selectedChips = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5",
  mt: "2",
  alignItems: "center",
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
  fontWeight: "bold",
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

  return (
    <>
      <Combobox
        id="review-crop"
        aria-label="作目"
        aria-describedby="review-crop-selection"
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

      <div id="review-crop-selection" className={selectedChips} aria-live="polite">
        {selectedCropIds.length > 0 ? (
          selectedCropIds.map((cropId) => {
            const crop = cropById.get(cropId);
            if (crop === undefined) return null;

            return (
              <span key={crop.id}>
                <input type="hidden" name="cropIds" value={crop.id} />
                <TagChip
                  label={crop.name}
                  showCategoryLabel={false}
                  onRemove={() => onRemove(crop.id)}
                />
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
    </>
  );
}
