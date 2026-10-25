import Anthropic from "@anthropic-ai/sdk";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

export const PDF_READING_MODEL = "claude-opus-5-5";
// 思考と出力の合計の上限。ストリーミングで受けるので、HTTP の待ち時間の上限には当たらない。
const MAX_TOKENS = 64000;

type Speed = "fast" | "standard";

export type PdfExtractionUsage = {
  model: string;
  speed: Speed;
  inputTokens: number;
  outputTokens: number;
};

/** refusal は拒否、max_tokens は途中で止まった（入力が多すぎる場合も含む）、deadline は期限切れ、server_error は 5xx。 */
export type PdfExtractionError =
  | "refusal"
  | "max_tokens"
  | "deadline"
  | "server_error"
  | "invalid_output"
  | "failed";

export type PdfExtraction<T> =
  | { ok: true; output: T; usage: PdfExtractionUsage }
  | { ok: false; error: PdfExtractionError; usage: PdfExtractionUsage | null };

export type PdfExtractionRequest<TSchema extends v.GenericSchema> = {
  pdf: Uint8Array;
  /** モデルに返させる形。構造化出力の制約に合わせ、オブジェクトは v.strictObject、null 許容と省略可は使わない。 */
  schema: TSchema;
  system: string;
  instructions: string;
  /** この時刻（ミリ秒）を過ぎたら打ち切る。通常の速度でのやり直しにも同じ期限を使う。 */
  deadline: number;
};

/** Valibot のスキーマを、構造化出力に渡す JSON Schema にする。 */
export function outputJsonSchema(schema: v.GenericSchema): Anthropic.JSONOutputFormat["schema"] {
  return Object.fromEntries(
    Object.entries(toJsonSchema(schema)).filter(([key]) => key !== "$schema"),
  );
}

function usageOf(message: Anthropic.Message, requested: Speed): PdfExtractionUsage {
  const { usage } = message;
  return {
    model: message.model,
    speed: usage.speed ?? requested,
    inputTokens:
      usage.input_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0),
    outputTokens: usage.output_tokens,
  };
}

function parseOutput<TSchema extends v.GenericSchema>(
  message: Anthropic.Message,
  schema: TSchema,
  speed: Speed,
): PdfExtraction<v.InferOutput<TSchema>> {
  const usage = usageOf(message, speed);
  if (message.stop_reason === "refusal") return { ok: false, error: "refusal", usage };
  if (
    message.stop_reason === "max_tokens" ||
    message.stop_reason === "model_context_window_exceeded"
  )
    return { ok: false, error: "max_tokens", usage };
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : []));
  let json: unknown;
  try {
    json = JSON.parse(text.join(""));
  } catch {
    console.error("[pdf-reading] 出力が JSON ではない", message.stop_reason);
    return { ok: false, error: "invalid_output", usage };
  }
  const output = v.safeParse(schema, json);
  if (!output.success) {
    console.error("[pdf-reading] 出力の形式が不正", v.summarize(output.issues));
    return { ok: false, error: "invalid_output", usage };
  }
  return { ok: true, output: output.output, usage };
}

// 例外の種類ごとの失敗の理由。上から順に当てはめ、どれでもなければ failed。
const FAILURES = [
  [Anthropic.APIUserAbortError, "deadline"],
  [Anthropic.APIConnectionTimeoutError, "deadline"],
  [Anthropic.InternalServerError, "server_error"],
] as const;

/**
 * PDF を document ブロックで渡し、schema の形の構造化出力で受ける。
 * fast mode で送り、429 か容量不足のときだけ通常の速度で1回やり直す。SDK の自動再試行は使わない。
 */
export async function extractFromPdf<TSchema extends v.GenericSchema>(
  client: Anthropic,
  request: PdfExtractionRequest<TSchema>,
  now: () => number = Date.now,
): Promise<PdfExtraction<v.InferOutput<TSchema>>> {
  const params = {
    model: PDF_READING_MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: outputJsonSchema(request.schema) },
    },
    system: request.system,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: Buffer.from(request.pdf).toString("base64"),
            },
          },
          { type: "text", text: request.instructions },
        ],
      },
    ],
  } satisfies Anthropic.MessageStreamParams;

  for (const speed of ["fast", "standard"] as const) {
    const remaining = request.deadline - now();
    if (remaining <= 0) return { ok: false, error: "deadline", usage: null };
    try {
      // timeout は応答の始まりまでしか効かないので、本文の受信も含めて signal で期限を守る
      const message = await client.messages
        .stream(
          { ...params, speed },
          { maxRetries: 0, timeout: remaining, signal: AbortSignal.timeout(remaining) },
        )
        .finalMessage();
      return parseOutput(message, request.schema, speed);
    } catch (error) {
      // fast mode の 429 と、容量不足の 529 だけ通常の速度でやり直す
      const fastUnavailable =
        error instanceof Anthropic.RateLimitError ||
        (error instanceof Anthropic.APIError && error.status === 529);
      if (speed === "fast" && fastUnavailable) continue;
      console.error("[pdf-reading] AI の呼び出しに失敗", error);
      const reason = FAILURES.find(([type]) => error instanceof type)?.[1] ?? "failed";
      return { ok: false, error: reason, usage: null };
    }
  }
  return { ok: false, error: "failed", usage: null };
}
