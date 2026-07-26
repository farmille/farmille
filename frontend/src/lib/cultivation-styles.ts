/**
 * プロフィールの栽培形態（選択式）。
 * モック（施設園芸・慣行栽培・土耕栽培）とタグシード（施設園芸・露地栽培・ハウス栽培）を合わせた固定語彙。
 */
export const CULTIVATION_STYLES = [
  "施設園芸",
  "露地栽培",
  "ハウス栽培",
  "慣行栽培",
  "有機栽培",
  "土耕栽培",
  "養液栽培",
] as const;

export type CultivationStyle = (typeof CULTIVATION_STYLES)[number];

export function isCultivationStyle(value: string): value is CultivationStyle {
  return (CULTIVATION_STYLES as readonly string[]).includes(value);
}
