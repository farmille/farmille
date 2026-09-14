import { PREFECTURES } from "./prefectures";
import { STANDPOINTS } from "./standpoints";
import type { Database } from "@/types/database.types";

/** 公開ビューの項目だけから、投稿者の肩書きを組み立てる。 */
export function publicProfileLabel(
  profile: Pick<
    Database["public"]["Views"]["public_profiles"]["Row"],
    "standpoint" | "prefecture_code"
  > | null,
): string {
  if (profile === null) return "";
  return [
    STANDPOINTS.find((item) => item.value === profile.standpoint)?.label,
    PREFECTURES.find((item) => item.code === profile.prefecture_code)?.name,
  ]
    .filter(Boolean)
    .join(" ・ ");
}
