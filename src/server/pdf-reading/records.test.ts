import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database, Json } from "@/types/database.types";

import {
  claimPdfReading,
  getReportPdfReadingMarks,
  recordPdfReadingApplied,
  recordPdfReadingResult,
  reportNeedsPdfValuesCheck,
} from "./records";

const userId = "5b0c2c55-6c2e-4c43-9d0e-3a1f6f0c7a11";
const reportId = "6c1d3d66-7d3f-4d54-8e1f-4b2a7a1d8b22";
const materialId = "7d2e4e77-8e4a-4e65-9f2a-5c3b8b2e9c33";
const readingId = "8e3f5f88-9f5b-4f76-8a3b-6d4c9c3fad44";
const plotId = "9f4a6a99-a06c-4a87-9b4c-7e5dadb4be55";
const uploadPath = `${userId}/${readingId}.pdf`;

type Sent = { path: string; query: URLSearchParams; body: Json };

function fakeSupabase(...responses: Response[]) {
  const sent: Sent[] = [];

  const client = createClient<Database>("http://supabase.test", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : input.toString());
        const text = await new Response(init?.body ?? null).text();
        sent.push({
          path: url.pathname,
          query: url.searchParams,
          body: text.length > 0 ? JSON.parse(text) : null,
        });
        const response = responses.shift();

        if (response === undefined) throw new Error(`想定外の要求：${url.pathname}`);

        return response;
      },
    },
  });

  return { client, sent };
}

const json = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const dbError = (code: string, message: string, status = 400) =>
  json({ code, message, details: null, hint: null }, status);

afterEach(() => vi.restoreAllMocks());

describe("回数の確保", () => {
  it("利用者・下書き・資材・PDF の場所を渡し、記録の id と残り回数を返す", async () => {
    const { client, sent } = fakeSupabase(json([{ reading_id: readingId, remaining: 9 }]));
    const result = await claimPdfReading({ userId, reportId, materialId, uploadPath }, client);
    expect(result).toEqual({ ok: true, data: { readingId, remaining: 9 } });
    expect(sent).toEqual([
      {
        path: "/rest/v1/rpc/claim_pdf_reading",
        query: new URLSearchParams(),
        body: {
          p_user_id: userId,
          p_report_id: reportId,
          p_material_id: materialId,
          p_upload_path: uploadPath,
        },
      },
    ]);
  });

  it("今月の上限に達したら pdf_reading_limit、同じアップロードの2回目は conflict を返す", async () => {
    const limited = fakeSupabase(dbError("P0001", "pdf_reading_limit"));
    expect(
      await claimPdfReading({ userId, reportId, materialId, uploadPath }, limited.client),
    ).toEqual({ ok: false, error: "pdf_reading_limit" });

    const repeated = fakeSupabase(
      dbError(
        "23505",
        'duplicate key value violates unique constraint "pdf_readings_upload_path_key"',
        409,
      ),
    );

    expect(
      await claimPdfReading({ userId, reportId, materialId, uploadPath }, repeated.client),
    ).toEqual({ ok: false, error: "conflict" });
  });

  it("PDF の場所の形が違えば、DB に送らず invalid_body を返す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client, sent } = fakeSupabase();

    const result = await claimPdfReading(
      { userId, reportId, materialId, uploadPath: `${userId}/成績書.pdf` },
      client,
    );

    expect(result).toEqual({ ok: false, error: "invalid_body" });
    expect(sent).toEqual([]);
  });
});

describe("結果の記録", () => {
  it("成功はモデル・速度・トークン数を記録する", async () => {
    const { client, sent } = fakeSupabase(new Response(null, { status: 204 }));

    const result = await recordPdfReadingResult(
      {
        readingId,
        userId,
        status: "succeeded",
        model: "claude-opus-5-5",
        speed: "fast",
        inputTokens: 1200,
        outputTokens: 300,
      },
      client,
    );

    expect(result).toEqual({ ok: true, data: null });
    expect(sent).toEqual([
      {
        path: "/rest/v1/rpc/finish_pdf_reading",
        query: new URLSearchParams(),
        body: {
          p_reading_id: readingId,
          p_user_id: userId,
          p_status: "succeeded",
          p_model: "claude-opus-5-5",
          p_speed: "fast",
          p_input_tokens: 1200,
          p_output_tokens: 300,
        },
      },
    ]);
  });

  it("応答の無い失敗は理由だけを記録し、トークン数を送らない", async () => {
    const { client, sent } = fakeSupabase(new Response(null, { status: 204 }));
    await recordPdfReadingResult(
      {
        readingId,
        userId,
        status: "failed",
        errorCode: "timeout",
        model: "claude-opus-5-5",
        speed: "standard",
        inputTokens: null,
        outputTokens: null,
      },
      client,
    );
    expect(sent[0]?.body).toEqual({
      p_reading_id: readingId,
      p_user_id: userId,
      p_status: "failed",
      p_model: "claude-opus-5-5",
      p_speed: "standard",
      p_error_code: "timeout",
    });
  });
});

describe("適用の記録", () => {
  it("入れた値と引用を、欄の経路と一緒に送る", async () => {
    const { client, sent } = fakeSupabase(new Response(null, { status: 204 }));

    const fields = [
      { fieldKey: "observedChange" as const, value: "葉色が濃い", quote: "処理区で葉色が濃い" },
      { fieldKey: `plots.${plotId}.name` as const, value: "処理区", quote: "処理区（1000倍）" },
    ];

    expect(await recordPdfReadingApplied({ readingId, userId, fields }, client)).toEqual({
      ok: true,
      data: null,
    });
    expect(sent[0]).toEqual({
      path: "/rest/v1/rpc/apply_pdf_reading",
      query: new URLSearchParams(),
      body: { p_reading_id: readingId, p_user_id: userId, p_fields: fields },
    });
  });

  it("同じ欄が2回あれば、DB に送らず invalid_body を返す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client, sent } = fakeSupabase();
    const field = { fieldKey: `plots.${plotId}.name` as const, value: "処理区", quote: "" };
    expect(
      await recordPdfReadingApplied({ readingId, userId, fields: [field, field] }, client),
    ).toEqual({ ok: false, error: "invalid_body" });
    expect(sent).toEqual([]);
  });
});

describe("印の読み出し", () => {
  it("レポートで最後に適用した読み取りで入れた値と引用を返す", async () => {
    const { client, sent } = fakeSupabase(
      json([
        {
          fields: [
            { field_key: `plots.${plotId}.name`, value: "処理区", quote: "処理区（1000倍）" },
          ],
        },
      ]),
    );

    expect(await getReportPdfReadingMarks(reportId, client)).toEqual({
      ok: true,
      data: [{ fieldKey: `plots.${plotId}.name`, value: "処理区", quote: "処理区（1000倍）" }],
    });
    expect(sent[0]?.path).toBe("/rest/v1/pdf_readings");
    expect(sent[0]?.query.get("report_id")).toBe(`eq.${reportId}`);
    expect(sent[0]?.query.get("status")).toBe("eq.applied");
    expect(sent[0]?.query.get("order")).toBe("applied_at.desc");
    expect(sent[0]?.query.get("limit")).toBe("1");
  });

  it("適用済みの読み取りが無ければ空を返す", async () => {
    const { client } = fakeSupabase(json([]));
    expect(await getReportPdfReadingMarks(reportId, client)).toEqual({ ok: true, data: [] });
  });

  it("記録の欄の経路が今の一覧に無ければ internal にする", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { client } = fakeSupabase(
      json([{ fields: [{ field_key: "purposeNote", value: "", quote: "" }] }]),
    );

    expect(await getReportPdfReadingMarks(reportId, client)).toEqual({
      ok: false,
      error: "internal",
    });
  });
});

describe("提出時に読み取った値の確認が要るか", () => {
  it("成功か適用済みの読み取りが1件でもあれば true を返す", async () => {
    const applied = fakeSupabase(json([{ id: readingId }]));
    expect(await reportNeedsPdfValuesCheck(reportId, applied.client)).toEqual({
      ok: true,
      data: true,
    });
    expect(applied.sent[0]?.query.get("status")).toBe("in.(succeeded,applied)");
    const none = fakeSupabase(json([]));
    expect(await reportNeedsPdfValuesCheck(reportId, none.client)).toEqual({
      ok: true,
      data: false,
    });
  });
});
