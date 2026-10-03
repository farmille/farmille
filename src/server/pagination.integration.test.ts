import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { selectAllRows } from "@/server/pagination";
import type { Database } from "@/types/database.types";

const localSupabaseUrl = process.env.SUPABASE_LOCAL_URL;

describe.skipIf(localSupabaseUrl === undefined)("selectAllRows 統合", () => {
  it("作物マスタを PostgREST の max_rows に関係なく重複なく全件取得する", async () => {
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (localSupabaseUrl === undefined)
      throw new Error("SUPABASE_LOCAL_URL が設定されていません。");
    if (publishableKey === undefined || publishableKey.length === 0) {
      throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません。");
    }
    const client = createClient<Database>(localSupabaseUrl, publishableKey);

    const total = await client.from("crops").select("id", { count: "exact", head: true });
    if (total.error !== null) throw total.error;
    if (total.count === null) throw new Error("作物の件数が返されませんでした。");

    const result = await selectAllRows((from, to) =>
      client.from("crops").select("id").order("id").range(from, to),
    );
    if (result.error !== null) throw result.error;

    expect(result.data).toHaveLength(total.count);
    expect(new Set(result.data.map((row) => row.id)).size).toBe(total.count);
  });
});
