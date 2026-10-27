import type { RegisteredContact } from "@/server/accounts/registered-address";

import { PREFECTURES } from "@/lib/prefectures";

/**
 * 設定の一覧に添える本人情報の要約（本名・都道府県）。市区町村は番地と同じ欄にあり切り出せないので出さない。
 * 連絡先の行が無いアカウントは「未登録」とする。
 */
export function contactSummary({ prefectureCode, contact }: RegisteredContact): string {
  if (contact === null) return "未登録";
  const name = `${contact.family_name} ${contact.given_name}`;
  const prefecture = PREFECTURES.find((item) => item.code === prefectureCode);
  return prefecture === undefined ? name : `${name}・${prefecture.name}`;
}
