import * as v from "valibot";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";

export async function readMaterialPageImage(id: string) {
  if (!v.is(v.pipe(v.string(), v.uuid()), id)) return null;
  const db = await createServerSupabase();
  const { data: image, error } = await db
    .from("material_page_images")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("画像の閲覧権限を確認できませんでした。");
  if (!image) return null;
  // 公開版または閲覧可能な原稿であることをRLSで確認してから、非公開ストレージを読む。
  const result = await createAdminSupabase()
    .storage.from("manufacturer-drafts")
    .download(image.storage_path);
  if (result.error) throw new Error("製品画像を取得できませんでした。");
  return result.data;
}
