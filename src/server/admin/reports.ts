import type { SupabaseClient } from "@supabase/supabase-js";

import { WITHDRAWN_MEMBER_NAME } from "@/lib/public-profile-label";
import { reportAdminError, withAdmin } from "@/server/admin/guard";
import { adminMember, type AdminMember } from "@/server/admin/members";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

type ContentReportRow = Database["public"]["Tables"]["content_reports"]["Row"];

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];

export const CONTENT_REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;

export type ContentReportStatus = (typeof CONTENT_REPORT_STATUSES)[number];

export const CONTENT_REPORT_STATUS_LABELS = {
  open: "未処理",
  resolved: "解決済み",
  dismissed: "却下",
} satisfies Record<ContentReportStatus, string>;

export const CONTENT_REPORT_TARGET_TYPES = [
  "review",
  "usage_report",
  "article",
  "profile",
  "material",
] as const;

export type ContentReportTargetType = (typeof CONTENT_REPORT_TARGET_TYPES)[number];

export const CONTENT_REPORT_TARGET_LABELS = {
  review: "感想口コミ",
  usage_report: "実証詳細レポート",
  article: "記事",
  profile: "プロフィール",
  material: "資材",
} satisfies Record<ContentReportTargetType, string>;

type ReportQueryRow = Pick<
  ContentReportRow,
  | "id"
  | "reporter_user_id"
  | "target_type"
  | "target_id"
  | "reason"
  | "status"
  | "resolved_by"
  | "resolved_at"
  | "created_at"
> & {
  reporter: Pick<ProfileRow, "user_id" | "handle" | "withdrawn_at"> | null;
};

export type AdminContentReportTarget = {
  type: ContentReportTargetType;
  label: string;
  publicHref: string | null;
  adminHref: string | null;
};

export type AdminContentReportItem = {
  id: string;
  reason: string;
  status: ContentReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  reporter: AdminMember;
  target: AdminContentReportTarget;
};

type TargetChange =
  | { type: "review"; targetId: string; previousStatus: string; changedStatus: "hidden" }
  | {
      type: "usage_report";
      targetId: string;
      previousStatus: string;
      changedStatus: "declined";
    }
  | { type: "article"; targetId: string; previousStatus: string; changedStatus: "draft" };

function reportError<ErrorValue>(operation: string, error: ErrorValue): void {
  reportAdminError("reports", operation, error);
}

export function isContentReportStatus(value: string | undefined): value is ContentReportStatus {
  return value !== undefined && CONTENT_REPORT_STATUSES.some((status) => status === value);
}

function isContentReportTargetType(value: string): value is ContentReportTargetType {
  return CONTENT_REPORT_TARGET_TYPES.some((type) => type === value);
}

function targetKey(type: ContentReportTargetType, id: string): string {
  return `${type}:${id}`;
}

function targetIds(rows: ReportQueryRow[], type: ContentReportTargetType): string[] {
  return [...new Set(rows.flatMap((row) => (row.target_type === type ? [row.target_id] : [])))];
}

async function loadReviewTargets(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Result<Map<string, AdminContentReportTarget>>> {
  const targets = new Map<string, AdminContentReportTarget>();

  if (ids.length === 0) return succeed(targets);

  const { data, error } = await supabase
    .from("reviews")
    .select("id, material_id, body")
    .in("id", ids);

  if (error !== null) {
    reportError("通報対象感想口コミの取得に失敗", error);

    return fail("internal");
  }

  const rows: Pick<ReviewRow, "id" | "material_id" | "body">[] = data;

  for (const row of rows) {
    const excerpt = row.body.length > 32 ? `${row.body.slice(0, 32)}…` : row.body;
    targets.set(targetKey("review", row.id), {
      type: "review",
      label: excerpt,
      publicHref: `/materials/${row.material_id}#review-${row.id}`,
      adminHref: null,
    });
  }

  return succeed(targets);
}

async function loadUsageReportTargets(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Result<Map<string, AdminContentReportTarget>>> {
  const targets = new Map<string, AdminContentReportTarget>();

  if (ids.length === 0) return succeed(targets);

  const { data, error } = await supabase.from("usage_reports").select("id, title").in("id", ids);

  if (error !== null) {
    reportError("通報対象実証詳細レポートの取得に失敗", error);

    return fail("internal");
  }

  const rows: Pick<UsageReportRow, "id" | "title">[] = data;

  for (const row of rows) {
    targets.set(targetKey("usage_report", row.id), {
      type: "usage_report",
      label: row.title ?? "無題の実証詳細レポート",
      publicHref: `/reports/${row.id}`,
      adminHref: `/admin/usage-reports/${row.id}`,
    });
  }

  return succeed(targets);
}

async function loadArticleTargets(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Result<Map<string, AdminContentReportTarget>>> {
  const targets = new Map<string, AdminContentReportTarget>();

  if (ids.length === 0) return succeed(targets);

  const { data, error } = await supabase.from("articles").select("id, title").in("id", ids);

  if (error !== null) {
    reportError("通報対象記事の取得に失敗", error);

    return fail("internal");
  }

  const rows: Pick<ArticleRow, "id" | "title">[] = data;

  for (const row of rows) {
    targets.set(targetKey("article", row.id), {
      type: "article",
      label: row.title,
      publicHref: `/articles/${row.id}`,
      adminHref: null,
    });
  }

  return succeed(targets);
}

async function loadProfileTargets(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Result<Map<string, AdminContentReportTarget>>> {
  const targets = new Map<string, AdminContentReportTarget>();

  if (ids.length === 0) return succeed(targets);

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, handle, withdrawn_at")
    .in("user_id", ids);

  if (error !== null) {
    reportError("通報対象プロフィールの取得に失敗", error);

    return fail("internal");
  }

  const rows: Pick<ProfileRow, "user_id" | "handle" | "withdrawn_at">[] = data;

  for (const row of rows) {
    const member = adminMember(row);

    if (member === null) {
      reportError("通報対象プロフィールのニックネームが欠落", { userId: row.user_id });

      return fail("internal");
    }

    targets.set(
      targetKey("profile", row.user_id),
      member.withdrawnAt === null
        ? {
            type: "profile",
            label: member.handle,
            publicHref: `/users/${member.userId}`,
            adminHref: null,
          }
        : {
            type: "profile",
            label: WITHDRAWN_MEMBER_NAME,
            publicHref: null,
            adminHref: null,
          },
    );
  }

  return succeed(targets);
}

async function loadMaterialTargets(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Result<Map<string, AdminContentReportTarget>>> {
  const targets = new Map<string, AdminContentReportTarget>();

  if (ids.length === 0) return succeed(targets);

  const { data, error } = await supabase.from("materials").select("id, name").in("id", ids);

  if (error !== null) {
    reportError("通報対象資材の取得に失敗", error);

    return fail("internal");
  }

  const rows: Pick<MaterialRow, "id" | "name">[] = data;

  for (const row of rows) {
    targets.set(targetKey("material", row.id), {
      type: "material",
      label: row.name,
      publicHref: `/materials/${row.id}`,
      adminHref: `/admin/materials/${row.id}`,
    });
  }

  return succeed(targets);
}

/** 通報一覧。通報者の handle と auth user ID は運営内部情報として返す。 */
export async function listContentReports(
  status: ContentReportStatus | "all",
): Promise<Result<AdminContentReportItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const query = supabase
      .from("content_reports")
      .select(
        `
          id,
          reporter_user_id,
          target_type,
          target_id,
          reason,
          status,
          resolved_by,
          resolved_at,
          created_at,
          reporter:profiles!content_reports_reporter_user_id_fkey (
            user_id,
            handle,
            withdrawn_at
          )
        `,
      )
      .order("created_at", { ascending: false });

    const { data, error } = await (status === "all" ? query : query.eq("status", status));

    if (error !== null) {
      reportError("通報一覧の取得に失敗", error);

      return fail("internal");
    }

    const rows: ReportQueryRow[] = data;

    const targetResults = await Promise.all([
      loadReviewTargets(supabase, targetIds(rows, "review")),
      loadUsageReportTargets(supabase, targetIds(rows, "usage_report")),
      loadArticleTargets(supabase, targetIds(rows, "article")),
      loadProfileTargets(supabase, targetIds(rows, "profile")),
      loadMaterialTargets(supabase, targetIds(rows, "material")),
    ]);

    const targets = new Map<string, AdminContentReportTarget>();

    for (const result of targetResults) {
      if (!result.ok) return result;

      for (const [key, target] of result.data) targets.set(key, target);
    }

    const items: AdminContentReportItem[] = [];

    for (const row of rows) {
      const reporter = row.reporter === null ? null : adminMember(row.reporter);

      if (
        reporter === null ||
        !isContentReportStatus(row.status) ||
        !isContentReportTargetType(row.target_type)
      ) {
        reportError("通報一覧に不正な関連データまたは状態が含まれる", row);

        return fail("internal");
      }

      items.push({
        id: row.id,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by,
        reporter,
        target:
          targets.get(targetKey(row.target_type, row.target_id)) ??
          ({
            type: row.target_type,
            label: "（削除済み）",
            publicHref: null,
            adminHref: null,
          } satisfies AdminContentReportTarget),
      });
    }

    return succeed(items);
  });
}

async function hideReportedTarget(
  supabase: SupabaseClient<Database>,
  type: ContentReportTargetType,
  targetId: string,
): Promise<Result<TargetChange | null>> {
  if (type === "profile" || type === "material") {
    // v1 はアカウント凍結と資材非公開化を持たない。リンク先を確認して運用で対応する。
    return succeed(null);
  }

  if (type === "review") {
    const { data: review, error: loadError } = await supabase
      .from("reviews")
      .select("status")
      .eq("id", targetId)
      .maybeSingle();

    if (loadError !== null) {
      reportError("通報対象感想口コミの状態取得に失敗", loadError);

      return fail("internal");
    }

    if (review === null || review.status === "hidden") return succeed(null);

    if (review.status !== "published") return fail("conflict");

    const { data, error } = await supabase
      .from("reviews")
      .update({ status: "hidden" })
      .eq("id", targetId)
      .eq("status", review.status)
      .select("id");

    if (error !== null) {
      reportError("通報対象感想口コミの非公開化に失敗", error);

      return fail("internal");
    }

    if (data.length === 0) return fail("conflict");

    return succeed({
      type,
      targetId,
      previousStatus: review.status,
      changedStatus: "hidden",
    });
  }

  if (type === "usage_report") {
    const { data: report, error: loadError } = await supabase
      .from("usage_reports")
      .select("status")
      .eq("id", targetId)
      .maybeSingle();

    if (loadError !== null) {
      reportError("通報対象実証詳細レポートの状態取得に失敗", loadError);

      return fail("internal");
    }

    if (report === null || report.status === "declined") return succeed(null);

    if (!["draft", "pending", "published"].includes(report.status)) return fail("conflict");

    const { data, error } = await supabase
      .from("usage_reports")
      .update({ status: "declined" })
      .eq("id", targetId)
      .eq("status", report.status)
      .select("id");

    if (error !== null) {
      reportError("通報対象実証詳細レポートの非公開化に失敗", error);

      return fail("internal");
    }

    if (data.length === 0) return fail("conflict");

    return succeed({
      type,
      targetId,
      previousStatus: report.status,
      changedStatus: "declined",
    });
  }

  const { data: article, error: loadError } = await supabase
    .from("articles")
    .select("status")
    .eq("id", targetId)
    .maybeSingle();

  if (loadError !== null) {
    reportError("通報対象記事の状態取得に失敗", loadError);

    return fail("internal");
  }

  if (article === null || article.status === "draft") return succeed(null);

  if (article.status !== "published") return fail("conflict");

  const { data, error } = await supabase
    .from("articles")
    .update({ status: "draft" })
    .eq("id", targetId)
    .eq("status", article.status)
    .select("id");

  if (error !== null) {
    reportError("通報対象記事の非公開化に失敗", error);

    return fail("internal");
  }

  if (data.length === 0) return fail("conflict");

  return succeed({
    type,
    targetId,
    previousStatus: article.status,
    changedStatus: "draft",
  });
}

/** 処理記録に失敗した場合だけ、先に行った対象の非公開化を元へ戻す。 */
async function rollbackTarget(
  supabase: SupabaseClient<Database>,
  change: TargetChange,
): Promise<void> {
  const { error } =
    change.type === "review"
      ? await supabase
          .from("reviews")
          .update({ status: change.previousStatus })
          .eq("id", change.targetId)
          .eq("status", change.changedStatus)
      : change.type === "usage_report"
        ? await supabase
            .from("usage_reports")
            .update({ status: change.previousStatus })
            .eq("id", change.targetId)
            .eq("status", change.changedStatus)
        : await supabase
            .from("articles")
            .update({ status: change.previousStatus })
            .eq("id", change.targetId)
            .eq("status", change.changedStatus);

  if (error !== null) reportError("通報対象の非公開化の巻き戻しに失敗", { change, error });
}

/** open の通報を resolved または dismissed へ進め、処理者と処理日時を記録する。 */
export async function processContentReport(
  reportId: string,
  nextStatus: Exclude<ContentReportStatus, "open">,
): Promise<Result<null>> {
  return withAdmin(async ({ session, supabase }) => {
    const { data: report, error: loadError } = await supabase
      .from("content_reports")
      .select("target_type, target_id, status")
      .eq("id", reportId)
      .maybeSingle();

    if (loadError !== null) {
      reportError("処理対象の通報取得に失敗", loadError);

      return fail("internal");
    }

    if (report === null) return fail("not_found");

    if (report.status !== "open") return fail("conflict");

    if (!isContentReportTargetType(report.target_type)) {
      reportError("未知の通報対象種別", report.target_type);

      return fail("internal");
    }

    const targetChange =
      nextStatus === "resolved"
        ? await hideReportedTarget(supabase, report.target_type, report.target_id)
        : succeed(null);

    if (!targetChange.ok) return targetChange;

    const { data, error } = await supabase
      .from("content_reports")
      .update({
        status: nextStatus,
        resolved_by: session.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("status", "open")
      .select("id");

    if (error !== null || data.length === 0) {
      if (targetChange.data !== null) await rollbackTarget(supabase, targetChange.data);

      if (error !== null) {
        reportError("通報の処理記録に失敗", error);

        return fail("internal");
      }

      return fail("conflict");
    }

    return succeed(null);
  });
}
