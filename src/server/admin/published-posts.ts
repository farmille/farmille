import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import * as v from "valibot";
import { withAdmin, reportAdminError } from "@/server/admin/guard";
import { fail, succeed } from "@/server/result";

const RemovalSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  type: v.picklist(["review", "usage_report"]),
  confirmed: v.literal("on"),
});

export async function listPublishedPosts() {
  return withAdmin(async ({ supabase }) => {
    const [reviews, reports] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, body, material_id, author_user_id, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("usage_reports")
        .select("id, title, material_id, author_user_id, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);
    if (reviews.error || reports.error) {
      reportAdminError(
        "published-posts",
        "公開済み投稿の取得に失敗",
        reviews.error ?? reports.error,
      );
      return fail("internal");
    }
    return succeed(
      [
        ...reviews.data.map((row) => ({
          id: row.id,
          type: "review" as const,
          title: row.body,
          href: `/materials/${row.material_id}#review-${row.id}`,
          createdAt: row.created_at,
        })),
        ...reports.data.map((row) => ({
          id: row.id,
          type: "usage_report" as const,
          title: row.title ?? "無題の実証詳細レポート",
          href: `/admin/usage-reports/${row.id}`,
          createdAt: row.created_at,
        })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  });
}

export async function removePublishedPost(formData: FormData) {
  return withAdmin(({ supabase }) => removePublishedPostWithSupabase(formData, supabase));
}

export async function removePublishedPostWithSupabase(
  formData: FormData,
  supabase: SupabaseClient<Database>,
) {
  const input = v.safeParse(RemovalSchema, {
    id: formData.get("id"),
    type: formData.get("type"),
    confirmed: formData.get("confirmed"),
  });
  if (!input.success) return fail("invalid_body");
  const { id, type } = input.output;
  const query =
    type === "review"
      ? supabase.from("reviews").update({ status: "hidden" })
      : supabase.from("usage_reports").update({ status: "declined", published_at: null });
  const result = await query
    .eq("id", id)
    .eq("status", "published")
    .select("material_id, author_user_id")
    .maybeSingle();
  if (result.error) {
    reportAdminError("published-posts", "投稿の非公開化に失敗", result.error);
    return fail("internal");
  }
  if (result.data === null) return fail("conflict");
  return succeed({
    id,
    type,
    materialId: result.data.material_id,
    authorUserId: result.data.author_user_id,
  });
}
