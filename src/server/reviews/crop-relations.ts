export type ReviewCropSummary = {
  /** 作物マスタのID。「その他」に自由記入した作目はnull。 */
  id: string | null;
  name: string;
};

export type ReviewCropRelation = {
  sort_order: number;
  crop_name_other: string | null;
  crop: { id: string; name: string } | null;
};

function cropSummary(relation: ReviewCropRelation | null): ReviewCropSummary | null {
  if (relation === null) return null;
  if (relation.crop !== null) return relation.crop;
  return relation.crop_name_other === null ? null : { id: null, name: relation.crop_name_other };
}

/** 1件の関連行を表示用配列へ変換する。欠損はDB不整合としてnullを返す。 */
export function orderedReviewCrops(
  relation: ReviewCropRelation | null,
): ReviewCropSummary[] | null {
  const crop = cropSummary(relation);
  return crop === null ? null : [crop];
}

export function reviewCropLabel(relation: ReviewCropRelation | null): string | null {
  return cropSummary(relation)?.name ?? null;
}
