import type { SupabaseClient } from "@supabase/supabase-js";

import { REPORT_REASON_OPTIONS, type ReportReasonCode } from "@/server/mutations/report-reasons";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export type { ReportReasonCode } from "@/server/mutations/report-reasons";
export { isReportReasonCode, REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";

/** content_reports.target_type のうち UI から通報できる種別（01 §3）。 */
export const REPORT_TARGET_TYPES = ["review", "usage_report", "article", "profile"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export function isReportTargetType(value: string): value is ReportTargetType {
  return REPORT_TARGET_TYPES.some((type) => type === value);
}

function reasonLabel(code: ReportReasonCode): string {
  const option = REPORT_REASON_OPTIONS.find((candidate) => candidate.value === code);
  if (option === undefined) {
    throw new Error(`未知の通報理由です：${code}`);
  }
  return option.label;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reportMutationError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/mutations/reports] ${operation}`, error);
}

/**
 * 通報対象が存在するかを確認する。存在すれば投稿者（一般ユーザーの場合のみ）を返し、
 * 自演通報の判定に使う。記事の投稿者は出品者のため null。
 */
async function assertReportTarget(
  supabase: SupabaseClient<Database>,
  targetType: ReportTargetType,
  targetId: string,
): Promise<Result<{ authorUserId: string | null }>> {
  if (targetType === "review") {
    const { data, error } = await supabase
      .from("reviews")
      .select("author_user_id, status")
      .eq("id", targetId)
      .maybeSingle();

    if (error !== null) {
      reportMutationError("通報対象レビューの確認に失敗", error);
      return fail("internal");
    }
    if (data === null || data.status !== "published") return fail("not_found");
    return succeed({ authorUserId: data.author_user_id });
  }

  if (targetType === "usage_report") {
    const { data, error } = await supabase
      .from("usage_reports")
      .select("author_user_id, status")
      .eq("id", targetId)
      .maybeSingle();

    if (error !== null) {
      reportMutationError("通報対象使用レポートの確認に失敗", error);
      return fail("internal");
    }
    if (data === null || data.status !== "published") return fail("not_found");
    return succeed({ authorUserId: data.author_user_id });
  }

  if (targetType === "article") {
    const { data, error } = await supabase
      .from("articles")
      .select("status")
      .eq("id", targetId)
      .maybeSingle();

    if (error !== null) {
      reportMutationError("通報対象記事の確認に失敗", error);
      return fail("internal");
    }
    if (data === null || data.status !== "published") return fail("not_found");
    return succeed({ authorUserId: null });
  }

  const { data, error } = await supabase
    .from("public_profiles")
    .select("user_id")
    .eq("user_id", targetId)
    .maybeSingle();

  if (error !== null) {
    reportMutationError("通報対象プロフィールの確認に失敗", error);
    return fail("internal");
  }
  if (data === null || data.user_id === null) return fail("not_found");
  return succeed({ authorUserId: data.user_id });
}

export type CreateContentReportInput = {
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  detail: string | null;
};

/**
 * 通報を1件登録する。二重通報は UNIQUE 制約ではなくアプリ側で検知し、
 * 既に open な通報があれば "already_reported" を返す（T-34）。
 */
export async function createContentReport(
  input: CreateContentReportInput,
): Promise<Result<{ reportId: string }>> {
  return createContentReportWithSupabase(input, createServerSupabase);
}

export async function createContentReportWithSupabase(
  input: CreateContentReportInput,
  createSupabase: typeof createServerSupabase,
): Promise<Result<{ reportId: string }>> {
  const { reporterUserId, targetType, targetId, reasonCode, detail } = input;

  if (!UUID_PATTERN.test(targetId)) return fail("not_found");

  const supabase = await createSupabase();
  const target = await assertReportTarget(supabase, targetType, targetId);
  if (!target.ok) return target;

  // 自分の投稿・自分自身のプロフィールは通報できない。
  if (target.data.authorUserId !== null && target.data.authorUserId === reporterUserId) {
    return fail("forbidden");
  }

  const { data: existing, error: existingError } = await supabase
    .from("content_reports")
    .select("id")
    .eq("reporter_user_id", reporterUserId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open")
    .maybeSingle();

  if (existingError !== null) {
    reportMutationError("既存の通報確認に失敗", existingError);
    return fail("internal");
  }
  if (existing !== null) return fail("already_reported");

  const trimmedDetail = detail?.trim() ?? "";
  const reason =
    trimmedDetail.length === 0
      ? reasonLabel(reasonCode)
      : `${reasonLabel(reasonCode)}：${trimmedDetail}`;

  const { data, error } = await supabase
    .from("content_reports")
    .insert({
      reporter_user_id: reporterUserId,
      target_type: targetType,
      target_id: targetId,
      reason,
    })
    .select("id")
    .single();

  if (error !== null) {
    reportMutationError("通報の登録に失敗", error);
    return fail("internal");
  }

  return succeed({ reportId: data.id });
}
