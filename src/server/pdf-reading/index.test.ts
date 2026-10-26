// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { PdfReadingRequest } from "@/lib/pdf-reading";
import { createBlankUsageReport, type UsageReportInput } from "@/lib/usage-report";
import { errorMessageJa } from "@/server/errors";
import { fail, succeed } from "@/server/result";

import type { ReportReadingOutput } from "./apply";
import type { PdfExtraction } from "./claude";
import { readPdfIntoDraft, type PdfReadingDeps } from "./index";

const userId = "5b0c2c55-6c2e-4c43-9d0e-3a1f6f0c7a11";
const materialId = "7d2e4e77-8e4a-4e65-9f2a-5c3b8b2e9c33";
const uploadPath = `${userId}/8e3f5f88-9f5b-4f76-8a3b-6d4c9c3fad44.pdf`;
const usage = {
  model: "claude-opus-5-5",
  speed: "fast" as const,
  inputTokens: 5000,
  outputTokens: 800,
};

const output: ReportReadingOutput = {
  outcome: "read",
  crop: "",
  prefecture: "",
  purposes: [],
  timingStages: [],
  cultivationEnvironment: "施設",
  timingNote: "",
  commonPlotDescription: "",
  observedChange: "",
  varieties: [{ key: "v1", name: "プリマラベンダー" }],
  comparedMaterials: [],
  plots: (["posted", "untreated"] as const).map((treatment) => ({
    key: treatment,
    name: treatment === "posted" ? "処理区" : "対照区",
    description: "",
    varietyKey: "v1",
    treatment,
    comparedMaterialKey: "",
  })),
  measurements: [{ key: "k1", name: "切り花長", unit: "cm", body: "" }],
  graphs: [{ key: "g1", measurementKey: "k1", heading: "" }],
  values: [{ graphKey: "g1", plotKey: "posted", value: "109.2" }],
  evidence: [{ ref: "cultivationEnvironment", quote: "ハウス", page: 1 }],
};

function makeRequest(
  input: UsageReportInput = createBlankUsageReport(materialId),
): PdfReadingRequest {
  return {
    input,
    uploadPath,
    recaptchaToken: "token",
    trial: "試験2の処理区がこの資材",
    consent: true,
  };
}

function fakeDeps(
  overrides: {
    human?: boolean;
    pdf?: Uint8Array | null;
    claim?: "pdf_reading_limit";
    extraction?: PdfExtraction<ReportReadingOutput>;
    /** 下書きの保存の結果を、呼ばれた順に返す。partial は本体だけ保存して使用目的の補足に失敗した。 */
    saves?: ReadonlyArray<"ok" | "conflict" | "partial">;
    sweep?: "throws";
    /** 読み取りの間に、別の画面で下書きの資材をこの id に変えて保存した。 */
    materialChangedTo?: string;
    /** 適用の記録の結果を、呼ばれた順に返す（足りなければ成功）。 */
    applies?: ReadonlyArray<"ok" | "fails">;
  } = {},
) {
  const calls: string[] = [];
  const saved: UsageReportInput[] = [];
  const finished: Array<{ status: string; errorCode?: string }> = [];
  const recorded: Array<{ fieldKey: string; value: string }> = [];
  const saves = [...(overrides.saves ?? ["ok", "ok"])];
  const applies = [...(overrides.applies ?? [])];
  let draft: UsageReportInput | null = null;
  let id = 0;
  let clock = 0;
  const deps: PdfReadingDeps = {
    async verifyHuman() {
      calls.push("verify");
      return overrides.human ?? true;
    },
    pdfs: {
      async take() {
        calls.push("take");
        return overrides.pdf === undefined ? new TextEncoder().encode("%PDF-1.4") : overrides.pdf;
      },
      async discard() {
        calls.push("discard");
      },
      async sweepExpired() {
        calls.push("sweep");
        if (overrides.sweep === "throws") throw new Error("storage down");
      },
    },
    async inspect() {
      calls.push("inspect");
      return { ok: true, pages: 3 };
    },
    async catalog() {
      calls.push("catalog");
      return succeed({
        catalog: { crops: [], effectNames: [], postedName: "高活性腐植資材" },
        material: { name: "高活性腐植資材", manufacturerName: "メーカー", aliases: [] },
      });
    },
    drafts: {
      async save(input) {
        calls.push("save");
        const outcome = saves.shift() ?? "ok";
        if (outcome === "conflict")
          return { ok: false, message: "別の画面で下書きが更新されています。", fieldErrors: {} };
        clock += 1;
        const updatedAt = `2026-10-25T00:00:0${clock}.000Z`;
        draft = { ...input, expectedUpdatedAt: updatedAt };
        saved.push(input);
        if (outcome === "partial")
          return {
            ok: false,
            message: "使用目的の補足を保存できませんでした。",
            fieldErrors: {},
            savedDraft: { updatedAt, status: "partial" },
          };
        return { ok: true, status: "draft", reportId: input.reportId, updatedAt, message: "" };
      },
      async load() {
        calls.push("load");
        const { materialChangedTo } = overrides;
        if (draft === null || materialChangedTo === undefined) return succeed(draft);
        return succeed({ ...draft, materialId: materialChangedTo });
      },
    },
    quota: {
      async claim() {
        calls.push("claim");
        return overrides.claim === undefined
          ? succeed({ readingId: "8e3f5f88-9f5b-4f76-8a3b-6d4c9c3fad44", remaining: 7 })
          : fail(overrides.claim);
      },
      async remaining() {
        calls.push("remaining");
        return succeed(overrides.claim === undefined ? 8 : 0);
      },
      async finish(outcome) {
        calls.push("finish");
        finished.push({
          status: outcome.status,
          errorCode: outcome.status === "failed" ? outcome.errorCode : undefined,
        });
        return succeed(null);
      },
      async applied(application) {
        calls.push("applied");
        if ((applies.shift() ?? "ok") === "fails") return fail("internal");
        recorded.push(...application.fields);
        return succeed(null);
      },
    },
    async read() {
      calls.push("read");
      return overrides.extraction ?? { ok: true, output, usage };
    },
    now: () => 0,
    newId: () => `00000000-0000-4000-8000-${String((id += 1)).padStart(12, "0")}`,
    async pause() {
      calls.push("pause");
    },
  };
  return { deps, calls, saved, finished, recorded };
}

describe("readPdfIntoDraft", () => {
  it("読み取りを下書きに写して保存し、入れた欄と残り回数を返す", async () => {
    const { deps, calls, finished, recorded } = fakeDeps();
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(calls).toEqual([
      "verify",
      "take",
      "inspect",
      "catalog",
      "save",
      "claim",
      "sweep",
      "read",
      "discard",
      "load",
      "finish",
      "save",
      "applied",
    ]);
    if (!result.ok) throw new Error(result.message);
    expect(result.remaining).toBe(7);
    expect(result.input.expectedUpdatedAt).toBe("2026-10-25T00:00:02.000Z");
    expect(result.input.cultivationEnvironment).toBe("施設");
    expect(result.input.plots.map(({ name }) => name)).toEqual(["処理区", "対照区"]);
    expect(finished).toEqual([{ status: "succeeded", errorCode: undefined }]);
    expect(result.marks).toEqual(recorded);
    expect(recorded).toContainEqual({
      fieldKey: "cultivationEnvironment",
      value: "施設",
      quote: "「ハウス」（1ページ）",
    });
  });

  it("要求の形が違う・読み取る試験が空・他人の PDF なら、何も触らず数えない", async () => {
    for (const request of [
      { ...makeRequest(), consent: false },
      { ...makeRequest(), trial: " 　" },
      { ...makeRequest(), uploadPath: `8e3f5f88-9f5b-4f76-8a3b-6d4c9c3fad44/${userId}.pdf` },
    ]) {
      const { deps, calls } = fakeDeps();
      // consent: false は型の上では作れないので、Server Action に届く不正な値として渡す
      const result = await readPdfIntoDraft(JSON.parse(JSON.stringify(request)), userId, deps);
      expect(result).toEqual({
        ok: false,
        error: "invalid_body",
        message: errorMessageJa.invalid_body,
        remaining: 8,
        savedDraft: null,
      });
      expect(calls).toEqual(["remaining"]);
    }
  });

  it("AI に送る前に止めたものは数えず、PDF は必ず消す", async () => {
    const cases = [
      [{ human: false }, "captcha_failed"],
      [{ pdf: null }, "pdf_invalid"],
      [{ saves: ["conflict" as const] }, "conflict"],
      [{ claim: "pdf_reading_limit" as const }, "pdf_reading_limit"],
    ] as const;
    for (const [overrides, error] of cases) {
      const { deps, calls, saved } = fakeDeps(overrides);
      const result = await readPdfIntoDraft(makeRequest(), userId, deps);
      expect(result.ok ? null : result.error).toBe(error);
      expect(calls).not.toContain("read");
      expect(calls).not.toContain("finish");
      expect(calls).toContain("discard");
      expect(saved.length).toBeLessThanOrEqual(1);
    }
  });

  it("先行保存より前に止めたら、保存した下書きは返さない", async () => {
    for (const overrides of [{ human: false }, { pdf: null }, { saves: ["conflict" as const] }]) {
      const { deps } = fakeDeps(overrides);
      const result = await readPdfIntoDraft(makeRequest(), userId, deps);
      expect(result.ok ? undefined : result.savedDraft).toBeNull();
    }
  });

  it("先行保存の後で止めたら、どの失敗でも先行保存の更新日時を返す", async () => {
    const long = {
      ...output,
      plots: output.plots.map((plot) => ({ ...plot, description: "あ".repeat(20001) })),
    };
    const cases = [
      [{ claim: "pdf_reading_limit" as const }, "pdf_reading_limit"],
      [
        { extraction: { ok: false as const, error: "server_error" as const, usage: null } },
        "pdf_reading_failed",
      ],
      [
        {
          extraction: {
            ok: true as const,
            output: { ...output, outcome: "no_matching_trial" as const },
            usage,
          },
        },
        "pdf_reading_no_match",
      ],
      [{ extraction: { ok: true as const, output: long, usage } }, "pdf_reading_incomplete"],
      [{ saves: ["ok" as const, "conflict" as const, "conflict" as const] }, "conflict"],
    ] as const;
    for (const [overrides, error] of cases) {
      const { deps } = fakeDeps(overrides);
      const request = makeRequest();
      const result = await readPdfIntoDraft(request, userId, deps);
      if (result.ok) throw new Error("失敗するはず");
      expect(result.error).toBe(error);
      expect(result.savedDraft).toEqual({
        saved: "input",
        reportId: request.input.reportId,
        updatedAt: "2026-10-25T00:00:01.000Z",
      });
    }
  });

  it("先行保存が一部だけ保存して失敗したら、進んだ更新日時を返し、入力は未保存として扱わせる", async () => {
    const { deps, calls } = fakeDeps({ saves: ["partial"] });
    const request = makeRequest();
    const result = await readPdfIntoDraft(request, userId, deps);
    if (result.ok) throw new Error("失敗するはず");
    expect(result.message).toBe("使用目的の補足を保存できませんでした。");
    expect(result.savedDraft).toEqual({
      saved: "partial",
      reportId: request.input.reportId,
      updatedAt: "2026-10-25T00:00:01.000Z",
    });
    expect(calls).not.toContain("claim");
  });

  it("読み取った値の保存が一部だけで終わったら、写し直して1回やり直し、だめなら最後に進んだ更新日時を返す", async () => {
    const once = fakeDeps({ saves: ["ok", "partial", "ok"] });
    expect((await readPdfIntoDraft(makeRequest(), userId, once.deps)).ok).toBe(true);

    const twice = fakeDeps({ saves: ["ok", "partial", "partial"] });
    const request = makeRequest();
    const result = await readPdfIntoDraft(request, userId, twice.deps);
    if (result.ok) throw new Error("失敗するはず");
    expect(result.savedDraft).toEqual({
      saved: "partial",
      reportId: request.input.reportId,
      updatedAt: "2026-10-25T00:00:03.000Z",
    });
    expect(twice.calls).not.toContain("applied");
  });

  it("先行保存の失敗は、保存の文言のまま返す", async () => {
    const { deps } = fakeDeps({ saves: ["conflict"] });
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(result.ok ? null : result.message).toBe("別の画面で下書きが更新されています。");
  });

  it("期限切れの PDF の掃除に失敗しても読み取りは続ける", async () => {
    const { deps } = fakeDeps({ sweep: "throws" });
    expect((await readPdfIntoDraft(makeRequest(), userId, deps)).ok).toBe(true);
  });

  it("AI 側の失敗は数え、PDF を消してから記録し、下書きは書き換えない", async () => {
    const cases = [
      ["refusal", "pdf_reading_failed"],
      ["deadline", "pdf_reading_failed"],
      ["server_error", "pdf_reading_failed"],
      ["max_tokens", "pdf_reading_incomplete"],
    ] as const;
    for (const [reason, error] of cases) {
      const { deps, calls, saved, finished } = fakeDeps({
        extraction: { ok: false, error: reason, usage: null },
      });
      const request = makeRequest();
      const result = await readPdfIntoDraft(request, userId, deps);
      expect(result).toEqual({
        ok: false,
        error,
        message: errorMessageJa[error],
        remaining: 7,
        savedDraft: {
          saved: "input",
          reportId: request.input.reportId,
          updatedAt: "2026-10-25T00:00:01.000Z",
        },
      });
      expect(finished).toEqual([{ status: "failed", errorCode: reason }]);
      expect(calls.indexOf("discard")).toBeLessThan(calls.indexOf("finish"));
      expect(saved).toHaveLength(1);
    }
  });

  it("投稿した資材の試験が無ければ数えたうえで該当なしにし、下書きは書き換えない", async () => {
    const { deps, saved, finished } = fakeDeps({
      extraction: { ok: true, output: { ...output, outcome: "no_matching_trial" }, usage },
    });
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(result.ok ? null : result.error).toBe("pdf_reading_no_match");
    expect(finished).toEqual([{ status: "failed", errorCode: "pdf_reading_no_match" }]);
    expect(saved).toHaveLength(1);
  });

  it("読み取りの間に下書きの資材が変わっていたら、数えたうえで写さずに失敗にする", async () => {
    const { deps, saved, finished, calls } = fakeDeps({
      materialChangedTo: "00000000-0000-4000-8000-000000000999",
    });
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(result.ok ? null : result.error).toBe("pdf_reading_material_changed");
    expect(finished).toEqual([{ status: "failed", errorCode: "pdf_reading_material_changed" }]);
    expect(saved).toHaveLength(1);
    expect(calls).not.toContain("applied");
  });

  it("保存できない大きさになるなら、範囲をしぼるよう返す", async () => {
    const long = {
      ...output,
      plots: output.plots.map((plot) => ({ ...plot, description: "あ".repeat(20001) })),
    };
    const { deps, saved } = fakeDeps({ extraction: { ok: true, output: long, usage } });
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(result.ok ? null : result.error).toBe("pdf_reading_incomplete");
    expect(saved).toHaveLength(1);
  });

  it("適用の記録に失敗したら、間をおいて2回までやり直す", async () => {
    const { deps, calls, recorded } = fakeDeps({ applies: ["fails", "fails"] });
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(calls.slice(calls.indexOf("applied"))).toEqual([
      "applied",
      "pause",
      "applied",
      "pause",
      "applied",
    ]);
    if (!result.ok) throw new Error(result.message);
    expect(result.marks).toEqual(recorded);
    expect(result.marks.length).toBeGreaterThan(0);
  });

  it("3回とも記録できなければ、値は下書きに入ったまま、根拠を記録できなかった失敗を返す", async () => {
    const { deps, calls, finished } = fakeDeps({ applies: ["fails", "fails", "fails"] });
    const result = await readPdfIntoDraft(makeRequest(), userId, deps);
    expect(calls.filter((call) => call === "applied")).toHaveLength(3);
    expect(finished).toEqual([{ status: "succeeded", errorCode: undefined }]);
    if (result.ok) throw new Error("失敗するはず");
    expect(result.error).toBe("pdf_reading_unrecorded");
    expect(result.message).toBe(errorMessageJa.pdf_reading_unrecorded);
    expect(result.remaining).toBe(7);
    if (result.savedDraft?.saved !== "read") throw new Error("読み取った入力を返していない");
    expect(result.savedDraft.input.cultivationEnvironment).toBe("施設");
    expect(result.savedDraft.input.expectedUpdatedAt).toBe("2026-10-25T00:00:02.000Z");
  });

  it("保存が別の保存と重なったら、最新の下書きに写し直して1回だけやり直す", async () => {
    const once = fakeDeps({ saves: ["ok", "conflict", "ok"] });
    expect((await readPdfIntoDraft(makeRequest(), userId, once.deps)).ok).toBe(true);
    expect(once.calls.filter((call) => call === "load")).toHaveLength(2);

    const twice = fakeDeps({ saves: ["ok", "conflict", "conflict"] });
    const result = await readPdfIntoDraft(makeRequest(), userId, twice.deps);
    expect(result.ok ? null : result.error).toBe("conflict");
    expect(twice.calls.filter((call) => call === "save")).toHaveLength(3);
    expect(twice.calls).not.toContain("applied");
  });
});
