import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "../../types/database.types";
import { cleanupExpiredReportMedia } from "./cleanup-media";

function storageTest(
  claim: { body: string; status: number },
  removal: { body: string; status: number },
) {
  const requests: { url: string; body: BodyInit | null | undefined }[] = [];
  const db = createClient<Database>("https://storage.example.test", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        requests.push({ url, body: init?.body });
        const response = url.includes("/rpc/") ? claim : removal;
        return new Response(response.body, {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  return { db, requests };
}

describe("cleanupExpiredReportMedia", () => {
  it("回収を確保したパスだけをStorage APIへ渡す", async () => {
    const { db, requests } = storageTest(
      { body: '[{"path":"user/report/old.jpg"}]', status: 200 },
      { body: '[{"name":"user/report/old.jpg"}]', status: 200 },
    );
    expect(await cleanupExpiredReportMedia(db)).toBe(1);
    expect(requests).toEqual([
      {
        url: "https://storage.example.test/rest/v1/rpc/claim_expired_report_media",
        body: '{"p_limit":100}',
      },
      {
        url: "https://storage.example.test/storage/v1/object/report-media",
        body: '{"prefixes":["user/report/old.jpg"]}',
      },
    ]);
  });
  it("対象がなければ削除APIを呼ばない", async () => {
    const { db, requests } = storageTest({ body: "[]", status: 200 }, { body: "[]", status: 200 });
    expect(await cleanupExpiredReportMedia(db)).toBe(0);
    expect(requests).toHaveLength(1);
  });
  it("確保に失敗したときは削除しない", async () => {
    const { db, requests } = storageTest(
      { body: '{"message":"database unavailable"}', status: 503 },
      { body: "[]", status: 200 },
    );
    await expect(cleanupExpiredReportMedia(db)).rejects.toThrow("確保できませんでした");
    expect(requests).toHaveLength(1);
  });
  it("削除の失敗や件数不足を成功にしない", async () => {
    for (const removal of [
      { body: '{"message":"storage unavailable"}', status: 503 },
      { body: "[]", status: 200 },
    ]) {
      const { db } = storageTest(
        { body: '[{"path":"user/report/old.jpg"}]', status: 200 },
        removal,
      );
      await expect(cleanupExpiredReportMedia(db)).rejects.toThrow("削除できませんでした");
    }
  });
  it("不正な確保結果では削除しない", async () => {
    const { db, requests } = storageTest(
      { body: '[{"path":null}]', status: 200 },
      { body: "[]", status: 200 },
    );
    await expect(cleanupExpiredReportMedia(db)).rejects.toThrow();
    expect(requests).toHaveLength(1);
  });
});
