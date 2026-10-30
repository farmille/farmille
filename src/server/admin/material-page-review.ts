import * as v from "valibot";
import { withAdmin, reportAdminError } from "@/server/admin/guard";
import { fail, succeed } from "@/server/result";

export async function listMaterialPageReviews() {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("material_page_versions")
      .select(
        "id,material_id,created_at,materials!material_page_versions_material_id_fkey(name),seller_accounts!material_page_versions_seller_id_fkey(official_name)",
      )
      .eq("status", "pending")
      .order("created_at");

    if (error) {
      reportAdminError("material-page-review", "確認待ち原稿の取得に失敗", error);

      return fail("internal");
    }

    return succeed(data);
  });
}

export async function listManufacturerProfileReviews() {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("manufacturer_profile_versions")
      .select(
        "id,created_at,seller_accounts!manufacturer_profile_versions_seller_id_fkey(official_name)",
      )
      .eq("status", "pending")
      .order("created_at");

    if (error) {
      reportAdminError("profile-review", "確認待ちの取得に失敗", error);

      return fail("internal");
    }

    return succeed(data);
  });
}

export async function reviewManufacturerProfile(input: {
  versionId: string;
  publish: boolean;
  note: string;
}) {
  const parsed = v.safeParse(
    v.object({
      versionId: v.pipe(v.string(), v.uuid()),
      publish: v.boolean(),
      note: v.pipe(v.string(), v.trim(), v.maxLength(10000)),
    }),
    input,
  );

  if (!parsed.success || (!parsed.output.publish && parsed.output.note.length === 0))
    return fail("invalid_body");

  return withAdmin(async ({ supabase, session }) => {
    const { data, error } = await supabase.rpc("review_manufacturer_profile_version", {
      p_version_id: parsed.output.versionId,
      p_actor_id: session.userId,
      p_publish: parsed.output.publish,
      p_note: parsed.output.note,
    });

    if (error) {
      reportAdminError("profile-review", "確認結果の保存に失敗", error);

      return fail(error.code === "40001" || error.code === "23505" ? "conflict" : "internal");
    }

    return succeed(data);
  });
}

export async function reviewMaterialPage(input: {
  versionId: string;
  publish: boolean;
  note: string;
}) {
  const parsed = v.safeParse(
    v.object({
      versionId: v.pipe(v.string(), v.uuid()),
      publish: v.boolean(),
      note: v.pipe(v.string(), v.trim(), v.maxLength(10000)),
    }),
    input,
  );

  if (!parsed.success || (!parsed.output.publish && parsed.output.note.length === 0))
    return fail("invalid_body");

  return withAdmin(async ({ supabase, session }) => {
    const { data, error } = await supabase.rpc("review_material_page_version", {
      p_version_id: parsed.output.versionId,
      p_actor_id: session.userId,
      p_publish: parsed.output.publish,
      p_note: parsed.output.note,
    });

    if (error) {
      reportAdminError("material-page-review", "表現確認結果の保存に失敗", error);

      return fail(
        error.code === "40001" || error.code === "23505"
          ? "conflict"
          : error.code === "42501"
            ? "forbidden"
            : "internal",
      );
    }

    return succeed(data);
  });
}
