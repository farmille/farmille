// 一般ユーザーの立場（profiles.standpoint）。内部専用で公開画面には表示しない。
export const STANDPOINTS = [
  { value: "farmer", label: "農家" },
  { value: "ja", label: "JA関係者" },
  { value: "expert", label: "専門家・研究者" },
  { value: "other", label: "その他" },
] as const satisfies readonly { value: string; label: string }[];

export type Standpoint = (typeof STANDPOINTS)[number]["value"];

export function isStandpoint(value: string | null): value is Standpoint {
  if (value === null) return false;
  return STANDPOINTS.some((standpoint) => standpoint.value === value);
}
