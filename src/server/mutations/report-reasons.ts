/**
 * 通報理由の選択肢。DB 依存を持たない純粋な定数のみを置くファイル。
 *
 * `@/server/mutations/reports` から実装を分離しているのは、この定数がクライアント
 * コンポーネント（`ReportDialog` のトリガーを組み込む `ReviewCard` 等）からも参照
 * されるため。`reports.ts` は `next/headers` に依存する `createServerSupabase` を
 * 読み込むので、そちらを直接 import すると `@/components` バレル経由でクライアント
 * バンドルに server-only コードが混入してビルドが失敗する（T-34 で確認済み）。
 */
export const REPORT_REASON_OPTIONS = [
  { value: "spam", label: "スパム・宣伝目的" },
  { value: "inappropriate", label: "不適切な内容" },
  { value: "false_info", label: "誤った情報・誇大な効果表現" },
  { value: "harassment", label: "誹謗中傷・嫌がらせ" },
  { value: "other", label: "その他" },
] as const;

export type ReportReasonCode = (typeof REPORT_REASON_OPTIONS)[number]["value"];

export function isReportReasonCode(value: string): value is ReportReasonCode {
  return REPORT_REASON_OPTIONS.some((option) => option.value === value);
}
