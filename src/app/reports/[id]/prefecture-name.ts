import { PREFECTURES } from "@/lib/prefectures";

/** 都道府県コード → 名称。未知コードは fail fast。 */
export function prefectureName(code: number): string {
  const found = PREFECTURES.find((item) => item.code === code);

  if (found === undefined) {
    throw new Error(`未知の都道府県コードです: ${code}`);
  }

  return found.name;
}
