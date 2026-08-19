const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** ISO 日時／日付を「2026年6月18日」形式（JST）で表示する。 */
export function formatDateJa(iso: string): string {
  // date 列（YYYY-MM-DD）は UTC 深夜解釈による日付ずれを避ける。
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return dateFormatter.format(new Date(`${iso}T12:00:00+09:00`));
  }

  return dateFormatter.format(new Date(iso));
}
