"use client";

import { useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { Combobox, type Option } from "@/components/form";
import type { ReviewCropOption } from "@/server/queries/reviews";

const SUGGESTION_LIMIT = 9;

const optionOf = (crop: ReviewCropOption): Option => ({
  value: crop.id,
  label: crop.name,
  description: crop.groupName,
});

/** 入力が空の間は、この資材の対象作物だけを候補に出す。ほかの作物は名前で検索して選ぶ。 */
export function ReviewCropPicker({
  crops,
  targetCropIds,
  value,
  onValueChange,
}: {
  crops: readonly ReviewCropOption[];
  targetCropIds: readonly string[];
  value: readonly string[];
  onValueChange: (cropIds: readonly string[]) => void;
}) {
  const form = useForm({ defaultValues: { query: "" } });
  const query = useStore(form.store, (state) => state.values.query);

  // Combobox は値の参照が変わるたびに欄のエラーを消すので、選択が変わらない限り同じ配列を渡す
  const selected = useMemo(
    () => value.flatMap((id) => crops.filter((crop) => crop.id === id).map(optionOf)),
    [crops, value],
  );

  const unselected = crops.filter((crop) => !value.includes(crop.id));
  const normalizedQuery = query.trim().toLocaleLowerCase("ja");

  const suggestions =
    normalizedQuery.length === 0
      ? targetCropIds.flatMap((id) => unselected.filter((crop) => crop.id === id))
      : unselected
          .filter(
            (crop) =>
              crop.name.toLocaleLowerCase("ja").includes(normalizedQuery) ||
              crop.groupName.toLocaleLowerCase("ja").includes(normalizedQuery) ||
              crop.aliases.some((alias) => alias.toLocaleLowerCase("ja").includes(normalizedQuery)),
          )
          .slice(0, SUGGESTION_LIMIT);

  return (
    <Combobox
      description={
        targetCropIds.length > 0
          ? "この資材を使った作物を1つ選びます。最初は、この資材の対象作物を表示しています。ほかの作物は名前を入力すると選べます。"
          : "この資材を使った作物を1つ選びます。作物の名前を入力すると、候補から選べます。"
      }
      label="使用対象作目"
      name="cropIds"
      requirement="required"
      emptyMessage={
        normalizedQuery.length === 0
          ? "作物の名前を入力すると、候補が出ます。"
          : "一致する作物がありません。"
      }
      filterMode="preFiltered"
      inputValue={query}
      multiple
      onInputValueChange={(query) => form.setFieldValue("query", query)}
      onValueChange={(next) => onValueChange(next.slice(-1).map((option) => option.value))}
      options={suggestions.map(optionOf)}
      placeholder="作物名を入力（例：トマト）"
      value={selected}
    />
  );
}
