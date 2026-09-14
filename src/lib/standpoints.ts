// 公開プロフィールと投稿に表示する立場。
export const STANDPOINTS = [
  { value: "farmer", label: "生産者" },
  { value: "ja", label: "JA関係者（指導員等も含む）" },
  { value: "government", label: "行政関係者（県の普及員など）" },
  { value: "other", label: "その他（メーカー関係者、専門家、研究者）" },
] as const satisfies readonly { value: string; label: string }[];

export type Standpoint = (typeof STANDPOINTS)[number]["value"];

export function isStandpoint(value: string | null): value is Standpoint {
  if (value === null) return false;
  return STANDPOINTS.some((standpoint) => standpoint.value === value);
}
