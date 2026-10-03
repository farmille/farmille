import { selectAllRows } from "@/server/pagination";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";

export type SitemapEntry = {
  id: string;
  updatedAt: string;
};

export type SitemapEntries = {
  materials: SitemapEntry[];
  articles: SitemapEntry[];
  reports: SitemapEntry[];
  sellers: SitemapEntry[];
  users: SitemapEntry[];
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/sitemap] ${operation}`, error);
}

/** 公開 URL の生成に必要な識別子と更新日時だけを取得する。 */
export async function listSitemapEntries(): Promise<Result<SitemapEntries>> {
  const supabase = createAdminSupabase();
  const [materials, articles, reports, sellers, users] = await Promise.all([
    selectAllRows((from, to) =>
      supabase
        .from("materials")
        .select("id, updated_at")
        .eq("publication_status", "published")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    selectAllRows((from, to) =>
      supabase
        .from("articles")
        .select("id, updated_at")
        .eq("status", "published")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    selectAllRows((from, to) =>
      supabase
        .rpc("list_usage_report_previews")
        .select("id, updated_at")
        .eq("status", "published")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    selectAllRows((from, to) =>
      supabase
        .from("seller_accounts")
        .select("id, updated_at")
        .eq("status", "approved")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    selectAllRows((from, to) =>
      supabase
        .from("profiles")
        .select("user_id, updated_at")
        .order("user_id", { ascending: true })
        .range(from, to),
    ),
  ]);

  if (materials.error !== null) {
    reportQueryError("資材一覧の取得に失敗", materials.error);
    return fail("internal");
  }
  if (articles.error !== null) {
    reportQueryError("記事一覧の取得に失敗", articles.error);
    return fail("internal");
  }
  if (reports.error !== null) {
    reportQueryError("実証詳細レポート一覧の取得に失敗", reports.error);
    return fail("internal");
  }
  if (sellers.error !== null) {
    reportQueryError("メーカー一覧の取得に失敗", sellers.error);
    return fail("internal");
  }
  if (users.error !== null) {
    reportQueryError("ユーザー一覧の取得に失敗", users.error);
    return fail("internal");
  }

  return succeed({
    materials: materials.data.map((row) => ({ id: row.id, updatedAt: row.updated_at })),
    articles: articles.data.map((row) => ({ id: row.id, updatedAt: row.updated_at })),
    reports: reports.data.map((row) => ({ id: row.id, updatedAt: row.updated_at })),
    sellers: sellers.data.map((row) => ({ id: row.id, updatedAt: row.updated_at })),
    users: users.data.map((row) => ({ id: row.user_id, updatedAt: row.updated_at })),
  });
}
