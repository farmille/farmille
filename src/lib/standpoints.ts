// 公開プロフィールと投稿に表示する立場。
export const STANDPOINTS = [
  { value: "farmer", label: "生産者" },
  { value: "ja", label: "JA営農指導員" },
  { value: "government", label: "普及指導員・都道府県研究員" },
  { value: "other", label: "その他" },
] as const satisfies readonly { value: string; label: string }[];

export type Standpoint = (typeof STANDPOINTS)[number]["value"];

export function isStandpoint(value: string | null): value is Standpoint {
  if (value === null) return false;
  return STANDPOINTS.some((standpoint) => standpoint.value === value);
}
