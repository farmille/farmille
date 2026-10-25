// @vitest-environment node
import Anthropic from "@anthropic-ai/sdk";
import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { extractFromPdf, outputJsonSchema } from "./claude";
import { PlotGroupsSchema, SingleFieldsSchema, SkeletonSchema, ValuesSchema } from "./stages";

const schema = v.strictObject({ answer: v.string() });
const pdf = new TextEncoder().encode("%PDF-1.4");

type Sent = { speed: string | undefined; body: string };

function sse(text: string, stopReason: string, speed: "fast" | "standard"): Response {
  const events = [
    {
      type: "message_start",
      message: {
        id: "msg_1",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 1, speed },
      },
    },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: 300 },
    },
    { type: "message_stop" },
  ];
  const body = events
    .map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    .join("");
  return new Response(body, { headers: { "content-type": "text/event-stream" } });
}

function apiError(status: number): Response {
  return Response.json(
    {
      type: "error",
      error: { type: status === 429 ? "rate_limit_error" : "api_error", message: "x" },
    },
    { status },
  );
}

function fakeClient(...responses: Array<Response | "hang">) {
  const sent: Sent[] = [];
  const client = new Anthropic({
    apiKey: "test-key",
    fetch: async (_url, init) => {
      const body = v.parse(v.string(), init?.body);
      const parsed = v.parse(v.object({ speed: v.optional(v.string()) }), JSON.parse(body));
      sent.push({ speed: parsed.speed, body });
      const next = responses.shift();
      if (next === undefined) throw new Error("想定外の要求");
      if (next !== "hang") return next;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    },
  });
  return { client, sent };
}

function clock(...times: number[]) {
  return () => times.shift() ?? 0;
}

const fastOpus = {
  model: "claude-opus-5-5",
  speed: "fast",
  effort: "high",
  adaptiveThinking: true,
  maxTokens: 64000,
} as const;
const request = {
  model: fastOpus,
  pdf,
  schema,
  system: "system",
  instructions: "指示",
  deadline: 110_000,
};

describe("extractFromPdf", () => {
  it("PDF を document で渡し、fast mode と構造化出力で受ける", async () => {
    const { client, sent } = fakeClient(sse('{"answer":"新藍"}', "end_turn", "fast"));
    const result = await extractFromPdf(client, request, clock(0));
    expect(result).toEqual({
      ok: true,
      output: { answer: "新藍" },
      usage: { model: "claude-opus-5-5", speed: "fast", inputTokens: 1200, outputTokens: 300 },
    });
    expect(sent).toHaveLength(1);
    const body = v.parse(
      v.object({
        speed: v.literal("fast"),
        thinking: v.object({ type: v.literal("adaptive") }),
        output_config: v.object({
          effort: v.literal("high"),
          format: v.object({ type: v.literal("json_schema") }),
        }),
        messages: v.tuple([
          v.object({
            content: v.tuple([
              v.object({ type: v.literal("document") }),
              v.object({ type: v.literal("text"), text: v.literal("指示") }),
            ]),
          }),
        ]),
      }),
      JSON.parse(sent[0]?.body ?? "{}"),
    );
    expect(body.speed).toBe("fast");
  });

  it("fast mode が 429 のときだけ、通常の速度で1回やり直す", async () => {
    const { client, sent } = fakeClient(
      apiError(429),
      sse('{"answer":"a"}', "end_turn", "standard"),
    );
    const result = await extractFromPdf(client, request, clock(0, 5_000));
    expect(result.ok && result.usage.speed).toBe("standard");
    expect(sent.map(({ speed }) => speed)).toEqual(["fast", undefined]);
  });

  it("通常の速度でも 429 なら、それ以上やり直さない", async () => {
    const { client, sent } = fakeClient(apiError(429), apiError(429));
    expect(await extractFromPdf(client, request, clock(0, 5_000))).toEqual({
      ok: false,
      error: "failed",
      usage: null,
    });
    expect(sent).toHaveLength(2);
  });

  it("5xx はやり直さずに server_error を返す", async () => {
    const { client, sent } = fakeClient(apiError(500));
    expect(await extractFromPdf(client, request, clock(0))).toEqual({
      ok: false,
      error: "server_error",
      usage: null,
    });
    expect(sent).toHaveLength(1);
  });

  it("やり直す時点で期限を過ぎていれば、送らずに期限切れにする", async () => {
    const { client, sent } = fakeClient(apiError(429));
    expect(await extractFromPdf(client, request, clock(0, 110_001))).toEqual({
      ok: false,
      error: "deadline",
      usage: null,
    });
    expect(sent).toHaveLength(1);
  });

  it("応答が期限までに終わらなければ打ち切る", async () => {
    const { client } = fakeClient("hang");
    const result = await extractFromPdf(client, { ...request, deadline: 30 }, clock(0));
    expect(result).toEqual({ ok: false, error: "deadline", usage: null });
  });

  it("拒否・途中で止まった・形の違う出力を区別する", async () => {
    const cases = [
      [sse("", "refusal", "fast"), "refusal"],
      [sse('{"answer":', "max_tokens", "fast"), "max_tokens"],
      [sse('{"other":1}', "end_turn", "fast"), "invalid_output"],
    ] as const;
    for (const [response, error] of cases) {
      const { client } = fakeClient(response);
      const result = await extractFromPdf(client, request, clock(0));
      expect(result.ok ? null : result.error).toBe(error);
      expect(result.usage?.outputTokens).toBe(300);
    }
  });

  it("通常の速度のモデルは speed を送らず、429 でもやり直さない", async () => {
    const { client, sent } = fakeClient(apiError(429));
    const sonnet = { ...fastOpus, model: "claude-sonnet-5-5", speed: "standard" } as const;
    expect(await extractFromPdf(client, { ...request, model: sonnet }, clock(0))).toEqual({
      ok: false,
      error: "failed",
      usage: null,
    });
    expect(sent.map(({ speed }) => speed)).toEqual([undefined]);
  });

  it("adaptiveThinking が false なら thinking を送らず、effort と max_tokens は設定のまま送る", async () => {
    const { client, sent } = fakeClient(sse('{"answer":"a"}', "end_turn", "standard"));
    const model = {
      ...fastOpus,
      speed: "standard",
      effort: "low",
      adaptiveThinking: false,
      maxTokens: 32000,
    } as const;
    await extractFromPdf(client, { ...request, model }, clock(0));
    const body = v.parse(
      v.object({
        thinking: v.optional(v.unknown()),
        max_tokens: v.number(),
        output_config: v.object({ effort: v.string() }),
      }),
      JSON.parse(sent[0]?.body ?? "{}"),
    );
    expect(body.thinking).toBeUndefined();
    expect(body.max_tokens).toBe(32000);
    expect(body.output_config.effort).toBe("low");
  });

  it("外から打ち切られたら、期限の前でも止める", async () => {
    const { client } = fakeClient("hang");
    const controller = new AbortController();
    const pending = extractFromPdf(client, { ...request, signal: controller.signal }, clock(0));
    controller.abort();
    expect(await pending).toEqual({ ok: false, error: "deadline", usage: null });
  });
});

type JsonNode = { [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonValue[] | JsonNode;
const JsonValueSchema: v.GenericSchema<JsonValue> = v.union([
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.array(v.lazy(() => JsonValueSchema)),
  v.record(
    v.string(),
    v.lazy(() => JsonValueSchema),
  ),
]);

const JsonNodeSchema = v.record(
  v.string(),
  v.lazy(() => JsonValueSchema),
);

function nodes(value: JsonValue): JsonNode[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!v.is(JsonNodeSchema, value)) return [];
  return [value, ...Object.values(value).flatMap(nodes)];
}

describe("レポートの読み取りの段ごとの出力スキーマ", () => {
  it.each([
    ["骨組み", SkeletonSchema],
    ["単独の欄", SingleFieldsSchema],
    ["値", ValuesSchema],
    ["区の説明", PlotGroupsSchema],
  ])(
    "%s は構造化出力の制約を満たす（省略可・null 許容・数や長さの制約を使わない）",
    (_, schema) => {
      const json = v.parse(JsonValueSchema, outputJsonSchema(schema));
      const all = nodes(json);
      const objects = all.filter((node) => node.type === "object");
      expect(objects.length).toBeGreaterThan(1);
      for (const node of objects) {
        expect(node.additionalProperties).toBe(false);
        expect(node.required).toEqual(Object.keys(v.parse(JsonNodeSchema, node.properties)));
      }
      const banned = [
        "anyOf",
        "oneOf",
        "allOf",
        "minimum",
        "maximum",
        "minLength",
        "maxLength",
        "maxItems",
        "$schema",
      ];
      for (const node of all) {
        for (const key of banned) expect(node, key).not.toHaveProperty(key);
        expect(Array.isArray(node.type), "型の配列（null 許容）").toBe(false);
        expect(node.type).not.toBe("null");
      }
    },
  );
});
