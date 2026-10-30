import Anthropic from "@anthropic-ai/sdk";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

type Speed = "fast" | "standard";

/** 1回の呼び出しのモデルと設定。 */
export type ExtractionModel = {
  model: string;
  /** fast は 429 と容量不足（529）のときだけ、通常の速度で1回やり直す。 */
  speed: Speed;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  /** false は thinking を送らず、モデルの既定に任せる（Sonnet 5.5 と Opus 5.5 の既定は adaptive）。 */
  adaptiveThinking: boolean;
  /** 思考と出力の合計の上限。ストリーミングで受けるので、HTTP の待ち時間の上限には当たらない。 */
  maxTokens: number;
};

export type PdfExtractionUsage = {
  model: string;
  speed: Speed;
  inputTokens: number;
  outputTokens: number;
};

/** max_tokens は、出力が上限で止まった場合と入力がコンテキストに収まらない場合。 */
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
  model: ExtractionModel;
  pdf: Uint8Array;
  /** モデルに返させる形。構造化出力の制約に合わせ、オブジェクトは v.strictObject、null 許容と省略可は使わない。 */
  schema: TSchema;
  system: string;
  instructions: string;
  /** この時刻（ミリ秒）を過ぎたら打ち切る。通常の速度でのやり直しにも同じ期限を使う。 */
  deadline: number;
  /** 期限より前に外から打ち切るとき（同時に呼んだほかの呼び出しが失敗したときなど）。 */
  signal?: AbortSignal;
};

export function outputJsonSchema(schema: v.GenericSchema): Anthropic.JSONOutputFormat["schema"] {
  // $schema は構造化出力が受け付けるキーワードに無いので外す
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

const FAILURES = [
  [Anthropic.APIUserAbortError, "deadline"],
  [Anthropic.APIConnectionTimeoutError, "deadline"],
  [Anthropic.InternalServerError, "server_error"],
] as const;

/**
 * PDF を document ブロックで渡し、schema の形の構造化出力で受ける。
 * fast mode なら、429 か容量不足のときだけ通常の速度で1回やり直す。SDK の自動再試行は使わない。
 */
export async function extractFromPdf<TSchema extends v.GenericSchema>(
  client: Anthropic,
  request: PdfExtractionRequest<TSchema>,
  now: () => number = Date.now,
): Promise<PdfExtraction<v.InferOutput<TSchema>>> {
  const { model } = request;

  const params: Anthropic.MessageStreamParams = {
    model: model.model,
    max_tokens: model.maxTokens,
    output_config: {
      effort: model.effort,
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
  };

  if (model.adaptiveThinking) params.thinking = { type: "adaptive" };

  const speeds: Speed[] = model.speed === "fast" ? ["fast", "standard"] : ["standard"];

  for (const speed of speeds) {
    const remaining = request.deadline - now();

    if (remaining <= 0 || request.signal?.aborted)
      return { ok: false, error: "deadline", usage: null };
    // timeout は応答の始まりまでしか効かないので、本文の受信も含めて signal で期限を守る
    const timeout = AbortSignal.timeout(remaining);

    const signal =
      request.signal === undefined ? timeout : AbortSignal.any([timeout, request.signal]);

    try {
      const message = await client.messages
        .stream(speed === "fast" ? { ...params, speed } : params, {
          maxRetries: 0,
          timeout: remaining,
          signal,
        })
        .finalMessage();

      return parseOutput(message, request.schema, speed);
    } catch (error) {
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
