// 公開プロフィールと投稿に表示する立場。
export const STANDPOINTS = [
  { value: "farmer", label: "生産者" },
  { value: "ja", label: "JAグループ職員（営農指導員など）" },
  { value: "government", label: "行政関係者（都道府県の普及員や研究員）" },
  { value: "other", label: "その他（メーカー関係者、専門家、大学研究員など）" },
] as const satisfies readonly { value: string; label: string }[];

export type Standpoint = (typeof STANDPOINTS)[number]["value"];

export function isStandpoint(value: string | null): value is Standpoint {
  if (value === null) return false;
  return STANDPOINTS.some((standpoint) => standpoint.value === value);
}
