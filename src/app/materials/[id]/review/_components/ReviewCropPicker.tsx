"use client";

import { useMemo, useState } from "react";

import { FieldError } from "@/app/_mock/FormParts";
import { MockCombobox } from "@/app/_mock/MockCombobox";
import type { ReviewCropOption } from "@/server/queries/reviews";

/**
 * 見本 S.reviewForm の作目ピッカー（`.ts-box`・`.ts-panel`・`.ts-chips`）。
 * 本番の仕様どおり作目は1件だけ選べる（選び直すと入れ替わる）。
 */
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
  // 送信時のエラーは、作目を選び直したら消す（選択が空のときだけ出す）。
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
      <MockCombobox
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

      <div id="review-crop-selection" className="ts-chips" aria-live="polite">
        {selectedCropIds.length > 0 ? (
          selectedCropIds.map((cropId) => {
            const crop = cropById.get(cropId);
            if (crop === undefined) return null;

            return (
              <span key={crop.id} className="chip-sel">
                <input type="hidden" name="cropIds" value={crop.id} />
                <span className="cat-mini">{crop.groupName}</span>
                {crop.name}
                <button
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
          <span className="muted">作目を1つ選んでください。</span>
        )}
      </div>
      <FieldError id="review-crop-error" message={shownError} />
    </>
  );
}
