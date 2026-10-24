import type { Database } from "@/types/database.types";

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

type ReportCoverCandidate = Pick<
  Database["public"]["Tables"]["usage_report_media"]["Row"],
  "id" | "media_type" | "sort_order" | "measurement_id"
>;

/** 一覧の表紙にする写真。調査項目に差し込んだ資料のグラフ・表の画像は、閲覧者がログインしていても使わない。 */
export function pickReportCover<Media extends ReportCoverCandidate>(media: Media[]): Media | null {
  return (
    media
      .filter((item) => item.media_type === "photo" && item.measurement_id === null)
      .toSorted((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))[0] ?? null
  );
}
