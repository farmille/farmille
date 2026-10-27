import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import { serverEnv } from "@/env";
import {
  pdfReadingFieldValue,
  PdfReadingRequestSchema,
  type PdfReadingField,
  type PdfReadingRequest,
  type PdfReadingResult,
} from "@/lib/pdf-reading";
import {
  UsageReportInputSchema,
  type UsageReportActionResult,
  type UsageReportInput,
} from "@/lib/usage-report";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import { listClassificationOptions } from "@/server/queries/classifications";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import {
  getStructuredUsageReport,
  saveStructuredUsageReport,
} from "@/server/usage-reports/structured";
import type { Database } from "@/types/database.types";

import {
  applyPdfReading,
  type AppliedField,
  type AppliedReading,
  type ReadingCatalog,
  type ReportReadingOutput,
} from "./apply";
import { extractFromPdf, type PdfExtraction } from "./claude";
import { inspectPdf, type PdfInspection } from "./pdf";
import type { ReadingMaterial } from "./prompt";
import { verifyRecaptcha } from "./recaptcha";
import {
  claimPdfReading,
  getPdfReadingRemaining,
  listExpiredPdfReadingUploads,
  recordPdfReadingApplied,
  recordPdfReadingResult,
  type PdfReadingApplication,
  type PdfReadingClaim,
  type PdfReadingOutcome,
} from "./records";
import { readReportPdf, type ReportReadingRequest } from "./stages";

const PDF_BUCKET = "pdf-reading-sources";
/** 読み取りの開始からの期限。関数の上限（maxDuration 120秒）までに保存を終える。 */
const DEADLINE_MS = 110_000;
/** Server Action の本文と保存の RPC の上限（1MB）より小さく保つ。 */
const INPUT_BYTES_MAX = 1_000_000;
const SWEEP_LIMIT = 100;
/** 適用の記録に失敗したときのやり直しの回数と間隔。 */
const RECORD_RETRIES = 2;
const RECORD_RETRY_MS = 500;

export type PdfReadingDeps = {
  verifyHuman(token: string): Promise<boolean>;
  pdfs: {
    take(path: string): Promise<Uint8Array | null>;
    discard(path: string): Promise<void>;
    /** 作成から1日を過ぎても残っている一時置き場の PDF を消す。 */
    sweepExpired(): Promise<void>;
  };
  inspect(bytes: Uint8Array): Promise<PdfInspection>;
  catalog(
    materialId: string,
  ): Promise<Result<{ catalog: ReadingCatalog; material: ReadingMaterial }>>;
  drafts: {
    save(input: UsageReportInput, droppedMediaUrls: string[]): Promise<UsageReportActionResult>;
    load(reportId: string): Promise<Result<UsageReportInput | null>>;
  };
  quota: {
    claim(claim: PdfReadingClaim): Promise<Result<{ readingId: string; remaining: number }>>;
    remaining(): Promise<Result<number>>;
    finish(outcome: PdfReadingOutcome): Promise<Result<null>>;
    applied(application: PdfReadingApplication): Promise<Result<null>>;
  };
  read(request: ReportReadingRequest): Promise<PdfExtraction<ReportReadingOutput>>;
  now(): number;
  newId(): string;
  /** 適用の記録をやり直す前に待つ。 */
  pause(ms: number): Promise<void>;
};

type Failure = Extract<PdfReadingResult, { ok: false }>;
type SavedDraft = Failure["savedDraft"];
type Stopped = { stopped: ErrorCode; message?: string };

/** 保存に失敗しても、本体だけ保存して下書きの更新日時が進んでいれば、画面が揃える先を返す。 */
function partialDraft(
  reportId: string,
  result: UsageReportActionResult,
): { saved: "partial"; reportId: string; updatedAt: string } | null {
  if (result.ok || result.savedDraft === undefined) return null;
  return { saved: "partial", reportId, updatedAt: result.savedDraft.updatedAt };
}

async function failure(
  error: ErrorCode,
  deps: PdfReadingDeps,
  savedDraft: SavedDraft,
  message: string = errorMessageJa[error],
  remaining?: number,
  pdfValuesCheckRequired = false,
): Promise<Failure> {
  const failed = { ok: false as const, error, message, savedDraft, pdfValuesCheckRequired };
  if (remaining !== undefined) return { ...failed, remaining };
  const left = await deps.quota.remaining();
  return { ...failed, remaining: left.ok ? left.data : null };
}

/** AI に送るまでの段階。ここで止めた分は回数に数えない（回数の確保より前で止めるため）。PDF はどこで抜けても消す。 */
async function sendToModel(
  request: PdfReadingRequest,
  userId: string,
  started: number,
  deps: PdfReadingDeps,
): Promise<
  // draft は、止めた時点で先行保存が済んでいればその結果
  | (Stopped & { draft: SavedDraft })
  | {
      draft: NonNullable<SavedDraft> & { saved: "input" };
      reading: { readingId: string; remaining: number };
      catalog: ReadingCatalog;
      extraction: PdfExtraction<ReportReadingOutput>;
    }
> {
  try {
    if (!(await deps.verifyHuman(request.recaptchaToken)))
      return { stopped: "captcha_failed", draft: null };
    const pdf = await deps.pdfs.take(request.uploadPath);
    if (pdf === null) return { stopped: "pdf_invalid", draft: null };
    const inspection = await deps.inspect(pdf);
    if (!inspection.ok) return { stopped: inspection.error, draft: null };
    const catalog = await deps.catalog(request.input.materialId);
    if (!catalog.ok) return { stopped: catalog.error, draft: null };
    // 未保存の入力を残し、新しいレポートなら下書きの行を作る（回数の確保は下書きの行を指す）
    const saved = await deps.drafts.save(request.input, request.droppedMediaUrls);
    if (!saved.ok)
      return {
        stopped: "conflict",
        message: saved.message,
        draft: partialDraft(request.input.reportId, saved),
      };
    // ここから後で止めても、画面はこの更新日時を取り込む（下書きの updated_at が進んだため）
    const draft = { saved: "input" as const, reportId: saved.reportId, updatedAt: saved.updatedAt };
    const reading = await deps.quota.claim({
      userId,
      reportId: request.input.reportId,
      materialId: request.input.materialId,
      uploadPath: request.uploadPath,
    });
    if (!reading.ok) return { stopped: reading.error, draft };
    try {
      await deps.pdfs.sweepExpired();
    } catch (error) {
      console.error("[pdf-reading] 期限切れの PDF の掃除に失敗", error);
    }
    const extraction = await deps.read({
      pdf,
      material: catalog.data.material,
      trial: request.trial,
      catalog: catalog.data.catalog,
      deadline: started + DEADLINE_MS,
      pages: inspection.pages,
    });
    return { draft, reading: reading.data, catalog: catalog.data.catalog, extraction };
  } finally {
    try {
      await deps.pdfs.discard(request.uploadPath);
    } catch (error) {
      console.error("[pdf-reading] PDF の削除に失敗", error);
    }
  }
}

/**
 * 下書きの最新の内容に読み取りを写し、保存できる大きさかを確かめる。
 * 読み取りの間に別の画面で資材が変わっていたら、読み取った資材の区や値を新しい資材の下書きに写さない。
 */
async function applyToLatest(
  request: PdfReadingRequest,
  output: ReportReadingOutput,
  catalog: ReadingCatalog,
  deps: PdfReadingDeps,
): Promise<Stopped | AppliedReading> {
  const latest = await deps.drafts.load(request.input.reportId);
  if (!latest.ok) return { stopped: latest.error };
  if (latest.data === null) return { stopped: "not_found" };
  if (latest.data.materialId !== request.input.materialId)
    return { stopped: "pdf_reading_material_changed" };
  const applied = applyPdfReading(latest.data, output, catalog, () => deps.newId());
  if (!applied.ok) return { stopped: applied.error };
  const fits =
    v.is(UsageReportInputSchema, applied.input) &&
    new TextEncoder().encode(JSON.stringify(applied.input)).byteLength < INPUT_BYTES_MAX &&
    applied.fields.length <= 2000;
  return fits ? applied : { stopped: "pdf_reading_incomplete" };
}

function recordedFields(input: UsageReportInput, fields: AppliedField[]): PdfReadingField[] {
  return fields.flatMap(({ fieldKey, quote }) => {
    const value = pdfReadingFieldValue(input, fieldKey);
    return value === undefined ? [] : [{ fieldKey, value, quote }];
  });
}

/**
 * 試験成績書の PDF を読み取り、実証詳細レポートの下書きに写して保存する。
 * 失敗しても下書きの入力は変えない。AI に送る前に止めた分は回数に数えない。
 */
export async function readPdfIntoDraft(
  untrusted: PdfReadingRequest,
  userId: string,
  deps: PdfReadingDeps,
): Promise<PdfReadingResult> {
  const started = deps.now();
  // Server Action の引数は型どおりとは限らないので、ここで検証する
  const parsed = v.safeParse(PdfReadingRequestSchema, untrusted);
  if (!parsed.success) return failure("invalid_body", deps, null);
  const request = parsed.output;
  if (request.uploadPath.split("/")[0] !== userId) return failure("invalid_body", deps, null);

  const sent = await sendToModel(request, userId, started, deps);
  if ("stopped" in sent) return failure(sent.stopped, deps, sent.draft, sent.message);
  const { draft, reading, catalog, extraction } = sent;
  const finish = (outcome: { status: "succeeded" } | { status: "failed"; errorCode: string }) => {
    const usage = extraction.usage;
    return deps.quota.finish(
      outcome.status === "succeeded" && usage !== null
        ? { readingId: reading.readingId, userId, status: "succeeded", ...usage }
        : {
            readingId: reading.readingId,
            userId,
            status: "failed",
            errorCode: outcome.status === "failed" ? outcome.errorCode : "internal",
            model: usage?.model ?? null,
            speed: usage?.speed ?? null,
            inputTokens: usage?.inputTokens ?? null,
            outputTokens: usage?.outputTokens ?? null,
          },
    );
  };
  // 先行保存の後なので、どの失敗でも、その時点で最後に進んだ下書きの更新日時を返す
  let latest: SavedDraft = draft;
  let pdfValuesCheckRequired = false;
  const counted = (error: ErrorCode, message?: string) =>
    failure(error, deps, latest, message, reading.remaining, pdfValuesCheckRequired);

  if (!extraction.ok) {
    await finish({ status: "failed", errorCode: extraction.error });
    return counted(
      extraction.error === "max_tokens" ? "pdf_reading_incomplete" : "pdf_reading_failed",
    );
  }

  let applied = await applyToLatest(request, extraction.output, catalog, deps);
  if ("stopped" in applied) {
    await finish({ status: "failed", errorCode: applied.stopped });
    return counted(applied.stopped);
  }
  const finished = await finish({ status: "succeeded" });
  if (!finished.ok) return counted("internal");
  pdfValuesCheckRequired = true;

  let saved = await deps.drafts.save(applied.input, []);
  if (!saved.ok) {
    const partial = partialDraft(request.input.reportId, saved);
    latest = partial ?? latest;
    if (partial === null) {
      applied = await applyToLatest(request, extraction.output, catalog, deps);
      if ("stopped" in applied) return counted(applied.stopped);
    } else {
      applied = { ...applied, input: { ...applied.input, expectedUpdatedAt: partial.updatedAt } };
    }
    saved = await deps.drafts.save(applied.input, []);
  }
  if (!saved.ok) {
    latest = partialDraft(request.input.reportId, saved) ?? latest;
    return counted("conflict", saved.message);
  }

  const input = { ...applied.input, expectedUpdatedAt: saved.updatedAt };
  const fields = recordedFields(input, applied.fields);
  const application = { readingId: reading.readingId, userId, fields };
  let recorded = await deps.quota.applied(application);
  for (let retry = 0; retry < RECORD_RETRIES && !recorded.ok; retry += 1) {
    await deps.pause(RECORD_RETRY_MS);
    recorded = await deps.quota.applied(application);
  }
  if (!recorded.ok) {
    // 値は下書きに保存済みなので、画面は読み取った入力に置き換える。succeeded のままなので提出時の確認は要る
    console.error("[pdf-reading] 適用の記録に失敗", recorded.error);
    return failure(
      "pdf_reading_unrecorded",
      deps,
      { saved: "read", input },
      undefined,
      reading.remaining,
      true,
    );
  }
  return { ok: true, input, marks: fields, remaining: reading.remaining };
}

async function loadReadingCatalog(
  materialId: string,
  supabase: SupabaseClient<Database>,
): Promise<Result<{ catalog: ReadingCatalog; material: ReadingMaterial }>> {
  const [options, material] = await Promise.all([
    listClassificationOptions(),
    supabase
      .from("materials")
      .select("name,manufacturer_name,aliases:material_name_aliases(name)")
      .eq("id", materialId)
      .eq("publication_status", "published")
      .maybeSingle(),
  ]);
  if (!options.ok) return options;
  if (material.error !== null) {
    console.error("[pdf-reading] 資材の取得に失敗", material.error);
    return fail("internal");
  }
  if (material.data === null) return fail("not_found");
  return succeed({
    catalog: {
      crops: options.data.crops,
      effectNames: options.data.effects.map(({ name }) => name),
      postedName: material.data.name,
    },
    material: {
      name: material.data.name,
      manufacturerName: material.data.manufacturer_name,
      aliases: material.data.aliases.map(({ name }) => name),
    },
  });
}

/** Server Action から呼ぶ本物の依存。PDF の取得と削除は本人の接続、回数の記録は service_role で行う。 */
export async function createPdfReadingDeps(userId: string): Promise<PdfReadingDeps> {
  const supabase = await createServerSupabase();
  const admin = createAdminSupabase();
  const anthropic = new Anthropic({ apiKey: serverEnv.anthropicApiKey, maxRetries: 0 });
  return {
    verifyHuman: (token) => verifyRecaptcha(token, serverEnv.recaptchaSecretKey),
    pdfs: {
      async take(path) {
        const { data, error } = await supabase.storage.from(PDF_BUCKET).download(path);
        if (error !== null) {
          console.error("[pdf-reading] PDF の取得に失敗", error);
          return null;
        }
        return new Uint8Array(await data.arrayBuffer());
      },
      async discard(path) {
        const { error } = await supabase.storage.from(PDF_BUCKET).remove([path]);
        if (error !== null) console.error("[pdf-reading] PDF の削除に失敗", error);
      },
      async sweepExpired() {
        const paths = await listExpiredPdfReadingUploads(SWEEP_LIMIT, admin);
        if (!paths.ok || paths.data.length === 0) return;
        const { error } = await admin.storage.from(PDF_BUCKET).remove(paths.data);
        if (error !== null) console.error("[pdf-reading] 期限切れの PDF の削除に失敗", error);
      },
    },
    inspect: inspectPdf,
    catalog: (materialId) => loadReadingCatalog(materialId, supabase),
    drafts: {
      save: (input, droppedMediaUrls) =>
        saveStructuredUsageReport(input, userId, false, droppedMediaUrls),
      load: (reportId) => getStructuredUsageReport(reportId, supabase),
    },
    quota: {
      claim: (claim) => claimPdfReading(claim, admin),
      remaining: () => getPdfReadingRemaining(userId, admin),
      finish: (outcome) => recordPdfReadingResult(outcome, admin),
      applied: (application) => recordPdfReadingApplied(application, admin),
    },
    read: (request) => readReportPdf((call) => extractFromPdf(anthropic, call), request),
    now: Date.now,
    newId: () => crypto.randomUUID(),
    pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

/** 画面の入口に出す今月の残り回数と、ブラウザで reCAPTCHA を動かすサイトキー。 */
export async function getPdfReadingEntry(
  userId: string,
): Promise<Result<{ remaining: number; siteKey: string }>> {
  const remaining = await getPdfReadingRemaining(userId, createAdminSupabase());
  if (!remaining.ok) return remaining;
  return succeed({ remaining: remaining.data, siteKey: serverEnv.recaptchaSiteKey });
}
