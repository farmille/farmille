export type ReviewCropSummary = {
  id: string;
  name: string;
};

export type ReviewCropRelation = {
  sort_order: number;
  crop: ReviewCropSummary | null;
};

/** 関連行を保存順へ戻す。0件や参照欠損はDB不整合としてnullを返す。 */
export function orderedReviewCrops(
  relations: readonly ReviewCropRelation[],
): ReviewCropSummary[] | null {
  if (relations.length === 0 || relations.some(({ crop }) => crop === null)) {
    return null;
  }

  return relations
    .toSorted(
      (left, right) =>
        left.sort_order - right.sort_order ||
        (left.crop?.id ?? "").localeCompare(right.crop?.id ?? ""),
    )
    .flatMap(({ crop }) => (crop === null ? [] : [crop]));
}

export function reviewCropLabel(relations: readonly ReviewCropRelation[]): string | null {
  const crops = orderedReviewCrops(relations);
  return crops === null ? null : crops.map(({ name }) => name).join("・");
}
