import { PREFECTURES } from "@/lib/prefectures";

/**
 * seller_accounts.region_scope の候補（01 §3）。
 * 全国・地方ブロック名・都道府県名のいずれかを保存する。
 */
export const REGION_BLOCKS = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州",
  "沖縄",
] as const;

export const REGION_SCOPES = [
  "全国",
  ...REGION_BLOCKS,
  ...PREFECTURES.map((prefecture) => prefecture.name),
] as const;

export type RegionScope = (typeof REGION_SCOPES)[number];

const REGION_SCOPE_SET = new Set<string>(REGION_SCOPES);

export function isRegionScope(value: string): value is RegionScope {
  return REGION_SCOPE_SET.has(value);
}
