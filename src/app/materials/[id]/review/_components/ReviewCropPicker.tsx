"use client";

import { useState } from "react";

import { Combobox, type Option } from "@/components/form";
import type { ReviewCropOption } from "@/server/queries/reviews";

const SUGGESTION_LIMIT = 9;

const optionOf = (crop: ReviewCropOption): Option => ({
  value: crop.id,
  label: crop.name,
  description: crop.groupName,
});

export function ReviewCropPicker({
  crops,
  defaultCropIds,
}: {
  crops: readonly ReviewCropOption[];
  defaultCropIds: readonly string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() =>
    defaultCropIds.flatMap((id) => crops.filter((crop) => crop.id === id).map(optionOf)),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("ja");
  const suggestions = crops
    .filter(
      (crop) =>
        !selected.some((option) => option.value === crop.id) &&
        (normalizedQuery.length === 0 ||
          crop.name.toLocaleLowerCase("ja").includes(normalizedQuery) ||
          crop.groupName.toLocaleLowerCase("ja").includes(normalizedQuery) ||
          crop.aliases.some((alias) => alias.toLocaleLowerCase("ja").includes(normalizedQuery))),
    )
    .slice(0, SUGGESTION_LIMIT)
    .map(optionOf);

  return (
    <Combobox
      description="作目を1つ選んでください。"
      label="作目"
      name="cropIds"
      requirement="required"
      emptyMessage="一致する作物がありません。"
      filterMode="preFiltered"
      inputValue={query}
      multiple
      onInputValueChange={setQuery}
      onValueChange={(next) => setSelected(next.slice(-1))}
      options={suggestions}
      placeholder="作物名を入力（例：みかん、デコポン）"
      value={selected}
    />
  );
}
