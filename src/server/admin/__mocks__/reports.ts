import { fn } from "storybook/test";

export function isContentReportStatus(
  value: string | null | undefined,
): value is import("@/server/admin/reports").ContentReportStatus {
  return value === "open" || value === "resolved" || value === "dismissed";
}

export const listContentReports = fn<typeof import("@/server/admin/reports").listContentReports>(
  async () => ({
    ok: true,
    data: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        reason: "掲載情報を更新するため",
        status: "open",
        createdAt: "2026-09-15T09:00:00Z",
        resolvedAt: null,
        resolvedBy: null,
        reporter: {
          userId: "11111111-1111-4111-8111-111111111111",
          handle: "緑の畑",
          withdrawnAt: null,
        },
        target: {
          type: "material",
          label: "内容を確認してください。",
          publicHref: null,
          adminHref: null,
        },
      },
    ],
  }),
).mockName("listContentReports");

export const processContentReport = fn<
  typeof import("@/server/admin/reports").processContentReport
>(async () => ({ ok: true, data: null })).mockName("processContentReport");

export const CONTENT_REPORT_STATUS_LABELS: typeof import("@/server/admin/reports").CONTENT_REPORT_STATUS_LABELS =
  {
    open: "未処理",
    resolved: "解決済み",
    dismissed: "却下",
  };

export const CONTENT_REPORT_TARGET_LABELS: typeof import("@/server/admin/reports").CONTENT_REPORT_TARGET_LABELS =
  {
    review: "感想口コミ",
    usage_report: "実証詳細レポート",
    article: "記事",
    profile: "プロフィール",
    material: "資材",
  };
