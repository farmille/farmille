import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import {
  PdfReadingFieldKeySchema,
  PdfReadingFieldsSchema,
  PdfReadingUploadPathSchema,
  type PdfReadingField,
} from "@/lib/pdf-reading";
import { ErrorCodeSchema } from "@/server/errors";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type Db = SupabaseClient<Database>;

const uuid = v.pipe(v.string(), v.uuid());
const count = v.pipe(v.number(), v.integer(), v.minValue(0));
const model = v.pipe(v.string(), v.minLength(1), v.maxLength(100));
const speed = v.picklist(["fast", "standard"]);
const reading = { readingId: uuid, userId: uuid };

const PdfReadingClaimSchema = v.object({
  userId: uuid,
  reportId: uuid,
  materialId: uuid,
  uploadPath: PdfReadingUploadPathSchema,
});
export type PdfReadingClaim = v.InferInput<typeof PdfReadingClaimSchema>;

const PdfReadingOutcomeSchema = v.variant("status", [
  v.object({
    ...reading,
    status: v.literal("succeeded"),
    model,
    speed,
    inputTokens: count,
    outputTokens: count,
  }),
  v.object({
    ...reading,
    status: v.literal("failed"),
    errorCode: v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_]{0,63}$/u)),
    model: v.nullable(model),
    speed: v.nullable(speed),
    inputTokens: v.nullable(count),
    outputTokens: v.nullable(count),
  }),
]);
/** AI の応答を受けた結果。失敗では、応答が無ければトークン数を null にする。 */
export type PdfReadingOutcome = v.InferInput<typeof PdfReadingOutcomeSchema>;

const PdfReadingApplicationSchema = v.object({ ...reading, fields: PdfReadingFieldsSchema });
export type PdfReadingApplication = v.InferInput<typeof PdfReadingApplicationSchema>;

function dbFailure(error: PostgrestError, action: string) {
  if (error.code === "23505") return fail("conflict");
  const code = v.safeParse(ErrorCodeSchema, error.message);
  if (code.success) return fail(code.output);
  console.error(`[pdf-reading] ${action}に失敗`, error);
  return fail("internal");
}

function invalidInput(action: string, issues: Parameters<typeof v.summarize>[0]) {
  console.error(`[pdf-reading] ${action}の入力が不正`, v.summarize(issues));
  return fail("invalid_body");
}

function malformedOutput(action: string, issues: Parameters<typeof v.summarize>[0]) {
  console.error(`[pdf-reading] ${action}の結果の形式が不正`, v.summarize(issues));
  return fail("internal");
}

/** 今月の回数を1回確保する。admin は service_role の接続。上限なら pdf_reading_limit、同じアップロードの2回目は conflict。 */
export async function claimPdfReading(
  claim: PdfReadingClaim,
  admin: Db,
): Promise<Result<{ readingId: string; remaining: number }>> {
  const input = v.safeParse(PdfReadingClaimSchema, claim);
  if (!input.success) return invalidInput("回数の確保", input.issues);
  const { data, error } = await admin.rpc("claim_pdf_reading", {
    p_user_id: input.output.userId,
    p_report_id: input.output.reportId,
    p_material_id: input.output.materialId,
    p_upload_path: input.output.uploadPath,
  });
  if (error !== null) return dbFailure(error, "回数の確保");
  const rows = v.safeParse(v.tuple([v.object({ reading_id: uuid, remaining: count })]), data);
  if (!rows.success) return malformedOutput("回数の確保", rows.issues);
  return succeed({ readingId: rows.output[0].reading_id, remaining: rows.output[0].remaining });
}

/** 今月の残り回数。admin は service_role の接続。 */
export async function getPdfReadingRemaining(userId: string, admin: Db): Promise<Result<number>> {
  const input = v.safeParse(uuid, userId);
  if (!input.success) return invalidInput("残り回数の取得", input.issues);
  const { data, error } = await admin.rpc("pdf_reading_remaining", { p_user_id: input.output });
  if (error !== null) return dbFailure(error, "残り回数の取得");
  const remaining = v.safeParse(count, data);
  if (!remaining.success) return malformedOutput("残り回数の取得", remaining.issues);
  return succeed(remaining.output);
}

/** 確保した読み取りの成功か失敗を記録する。1回の読み取りにつき1回だけ記録できる。 */
export async function recordPdfReadingResult(
  outcome: PdfReadingOutcome,
  admin: Db,
): Promise<Result<null>> {
  const input = v.safeParse(PdfReadingOutcomeSchema, outcome);
  if (!input.success) return invalidInput("結果の記録", input.issues);
  const result = input.output;
  const { error } = await admin.rpc("finish_pdf_reading", {
    p_reading_id: result.readingId,
    p_user_id: result.userId,
    p_status: result.status,
    p_model: result.model ?? undefined,
    p_speed: result.speed ?? undefined,
    p_input_tokens: result.inputTokens ?? undefined,
    p_output_tokens: result.outputTokens ?? undefined,
    p_error_code: result.status === "failed" ? result.errorCode : undefined,
  });
  if (error !== null) return dbFailure(error, "結果の記録");
  return succeed(null);
}

/** 成功した読み取りを下書きに写したことと、入れた値・引用を記録する。記録は後から変えない。 */
export async function recordPdfReadingApplied(
  application: PdfReadingApplication,
  admin: Db,
): Promise<Result<null>> {
  const input = v.safeParse(PdfReadingApplicationSchema, application);
  if (!input.success) return invalidInput("適用の記録", input.issues);
  const { error } = await admin.rpc("apply_pdf_reading", {
    p_reading_id: input.output.readingId,
    p_user_id: input.output.userId,
    p_fields: input.output.fields,
  });
  if (error !== null) return dbFailure(error, "適用の記録");
  return succeed(null);
}

/** レポートの最新の適用済みの読み取りで入れた値と引用。supabase は本人の接続（RLS で本人の記録だけが見える）。 */
export async function getReportPdfReadingMarks(
  reportId: string,
  supabase: Db,
): Promise<Result<PdfReadingField[]>> {
  const { data, error } = await supabase
    .from("pdf_readings")
    .select("fields:usage_report_pdf_reading_fields(field_key,value,quote)")
    .eq("report_id", reportId)
    .eq("status", "applied")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error !== null) return dbFailure(error, "印の取得");
  const rows = v.safeParse(
    v.array(
      v.object({
        fields: v.array(
          v.object({ field_key: PdfReadingFieldKeySchema, value: v.string(), quote: v.string() }),
        ),
      }),
    ),
    data,
  );
  if (!rows.success) return malformedOutput("印の取得", rows.issues);
  return succeed(
    (rows.output[0]?.fields ?? []).map((field) => ({
      fieldKey: field.field_key,
      value: field.value,
      quote: field.quote,
    })),
  );
}

/** レポートに適用済みの読み取りがあるか。提出時の確認が要るかどうかを決める。supabase は本人の接続。 */
export async function reportHasAppliedPdfReading(
  reportId: string,
  supabase: Db,
): Promise<Result<boolean>> {
  const { data, error } = await supabase
    .from("pdf_readings")
    .select("id")
    .eq("report_id", reportId)
    .eq("status", "applied")
    .limit(1);
  if (error !== null) return dbFailure(error, "読み取りの有無の取得");
  return succeed(data.length > 0);
}

/** 1日を過ぎても一時置き場に残っている PDF の場所。admin は service_role の接続。 */
export async function listExpiredPdfReadingUploads(
  limit: number,
  admin: Db,
): Promise<Result<string[]>> {
  const { data, error } = await admin.rpc("list_expired_pdf_reading_uploads", { p_limit: limit });
  if (error !== null) return dbFailure(error, "期限切れの PDF の取得");
  const paths = v.safeParse(v.array(PdfReadingUploadPathSchema), data);
  if (!paths.success) return malformedOutput("期限切れの PDF の取得", paths.issues);
  return succeed(paths.output);
}
