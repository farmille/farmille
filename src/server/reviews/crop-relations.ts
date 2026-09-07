export type ReviewCropSummary = {
  id: string;
  name: string;
};

export type ReviewCropRelation = {
  sort_order: number;
  crop: ReviewCropSummary | null;
};

/** 1件の関連行を表示用配列へ変換する。欠損はDB不整合としてnullを返す。 */
export function orderedReviewCrops(
  relation: ReviewCropRelation | null,
): ReviewCropSummary[] | null {
  return relation?.crop === null || relation?.crop === undefined ? null : [relation.crop];
}

export function reviewCropLabel(relation: ReviewCropRelation | null): string | null {
  return relation?.crop?.name ?? null;
}
