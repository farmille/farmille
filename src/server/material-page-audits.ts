import * as v from "valibot";
import { createServerSupabase } from "@/server/supabase";
import { withAdmin, reportAdminError } from "@/server/admin/guard";
import { fail, succeed } from "@/server/result";

export async function listMaterialPageAudits(materialId: string) {
  const db = await createServerSupabase();

  const { data, error } = await db
    .from("material_page_audits")
    .select("id,outcome,note,created_at")
    .eq("material_id", materialId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("掲載後の確認記録を取得できませんでした。");

  return data;
}

export async function recordMaterialPageAudit(input: {
  materialId: string;
  outcome: string;
  note: string;
}) {
  const parsed = v.safeParse(
    v.object({
      materialId: v.pipe(v.string(), v.uuid()),
      outcome: v.picklist(["checked", "correction_requested", "hidden"]),
      note: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(10000)),
    }),
    input,
  );

  if (!parsed.success) return fail("invalid_body");

  return withAdmin(async ({ supabase, session }) => {
    const { error } = await supabase.rpc("record_material_page_audit", {
      p_material_id: parsed.output.materialId,
      p_actor_id: session.userId,
      p_outcome: parsed.output.outcome,
      p_note: parsed.output.note,
    });

    if (error) {
      reportAdminError("material-audit", "確認記録の保存に失敗", error);

      return fail("internal");
    }

    return succeed(null);
  });
}

export async function listMaterialEditorGrants(materialId: string) {
  const db = await createServerSupabase();

  const { data, error } = await db
    .from("material_editor_grants")
    .select("id,seller_id,document_reference,granted_at,revoked_at")
    .eq("material_id", materialId)
    .order("granted_at", { ascending: false });

  if (error) throw new Error("資材オーナー権限の書類確認履歴を取得できませんでした。");

  return data;
}
