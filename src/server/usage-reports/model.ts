export const CULTIVATION_TYPES = [
  { value: "open_field", label: "露地栽培" },
  { value: "facility", label: "施設栽培" },
  { value: "other", label: "その他" },
] as const;

export type CultivationType = (typeof CULTIVATION_TYPES)[number]["value"];

export const MEDIA_PLACEMENTS = [
  { value: "observation", label: "観察した変化" },
  { value: "cover", label: "冒頭（カバー）" },
  { value: "method", label: "使用方法" },
  { value: "harvest", label: "収穫調査" },
  { value: "summary", label: "まとめ・感想" },
] as const;

const STORED_MEDIA_PLACEMENTS = [
  ...MEDIA_PLACEMENTS,
  { value: "treated", label: "処理区" },
  { value: "untreated", label: "対照区" },
] as const;

/** 保存済みの配置コードを運営画面向けの表示名へ変換する。 */
export function mediaPlacementLabel(placement: string | null): string | null {
  if (placement === null) return null;

  const option = STORED_MEDIA_PLACEMENTS.find(({ value }) => value === placement);
  if (option === undefined) {
    throw new Error(`未対応のメディア配置です：${placement}`);
  }

  return option.label;
}
