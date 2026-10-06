import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

import { createBlankUsageReport } from "@/lib/usage-report";

import { reportMediaUrl, runUsageReportSave, type UsageReportSaveStore } from "./structured";

describe("レポート写真の保存先", () => {
  it("投稿者の保存パスを正規のStorageへ解決し、別ホストや別投稿者への逸脱を拒否する", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://storage.example.test");
    const author = "11111111-1111-4111-8111-111111111111";
    const path = `/storage/v1/object/public/report-media/${author}/photo.png`;
    expect(reportMediaUrl(`https://untrusted.example.test${path}`, author)).toBe(
      `https://storage.example.test${path}`,
    );
    expect(() =>
      reportMediaUrl("https://example.test//untrusted.example.test/a.png", author),
    ).toThrow();
    expect(() =>
      reportMediaUrl(
        "https://example.test/storage/v1/object/public/report-media/another-user/photo.png",
        author,
      ),
    ).toThrow();
  });
});

describe("実証詳細レポートの保存手順", () => {
  function completeReport() {
    const input = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
    input.purposeNote = "  高温期の萎れを軽くしたかった ";
    return input;
  }
  function fakeStore(options: { failSubmit?: boolean; conflictNote?: boolean } = {}) {
    const calls: string[] = [];
    const rpcInputs: Array<{ keys: string[]; expectedUpdatedAt: string | null }> = [];
    const store: UsageReportSaveStore = {
      async saveReport(input, submit) {
        calls.push(submit ? "submit" : "draft");
        rpcInputs.push({ keys: Object.keys(input), expectedUpdatedAt: input.expectedUpdatedAt });
        if (submit && options.failSubmit) return { ok: false, message: "提出エラー。" };
        return {
          ok: true,
          status: submit ? "pending" : "draft",
          updatedAt: submit ? "t3" : "t1",
        };
      },
      async savePurposeNote(reportId, purposeNote, expectedUpdatedAt) {
        calls.push(`note:${purposeNote}@${expectedUpdatedAt}`);
        if (options.conflictNote) return { ok: false, message: "競合。" };
        return { ok: true, updatedAt: "t2" };
      },
    };
    return { store, calls, rpcInputs };
  }

  it("下書き保存は RPC のあとに使用目的の補足を書き込み、RPC には補足を渡さない", async () => {
    const { store, calls, rpcInputs } = fakeStore();
    const result = await runUsageReportSave(completeReport(), false, store);
    expect(calls).toEqual(["draft", "note:高温期の萎れを軽くしたかった@t1"]);
    expect(rpcInputs[0]?.keys).not.toContain("purposeNote");
    expect(result).toMatchObject({ ok: true, status: "draft", updatedAt: "t2" });
  });

  it("提出は下書き保存と補足の書き込みのあと、補足後の更新日時で照合して提出する", async () => {
    const { store, calls, rpcInputs } = fakeStore();
    const result = await runUsageReportSave(completeReport(), true, store);
    expect(calls).toEqual(["draft", "note:高温期の萎れを軽くしたかった@t1", "submit"]);
    expect(rpcInputs[1]?.expectedUpdatedAt).toBe("t2");
    expect(result).toMatchObject({ ok: true, status: "pending", updatedAt: "t3" });
  });

  it("提出だけが失敗した場合は、下書きの更新日時を返す", async () => {
    const { store } = fakeStore({ failSubmit: true });
    const result = await runUsageReportSave(completeReport(), true, store);
    expect(result).toMatchObject({ ok: false, savedUpdatedAt: "t2" });
  });

  it("補足の書き込みが競合したら提出しない", async () => {
    const { store, calls } = fakeStore({ conflictNote: true });
    const result = await runUsageReportSave(completeReport(), true, store);
    expect(calls).toHaveLength(2);
    expect(result).toMatchObject({ ok: false, savedUpdatedAt: "t1" });
  });
});
