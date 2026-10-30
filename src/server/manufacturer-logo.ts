import { requireSeller } from "@/server/auth";
import { createServerSupabase } from "@/server/supabase";

/** メーカー自身の領域に保存し、原稿の保存・表現確認を経てロゴへ反映する。 */
export async function uploadManufacturerLogo(file: File) {
  const session = await requireSeller();

  if (!session.ok) return { ok: false as const, message: "企業会員でログインしてください。" };

  const extensions = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);

  const extension = extensions.get(file.type);

  if (!extension || file.size === 0 || file.size > 2 * 1024 * 1024)
    return { ok: false as const, message: "ロゴは2MB以下のJPEG・PNG・WebPを選んでください。" };
  const db = await createServerSupabase();
  const path = `${session.data.sellerId}/logos/${crypto.randomUUID()}.${extension}`;

  const { error } = await db.storage.from("material-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[manufacturer-logo] アップロードに失敗", error);

    return {
      ok: false as const,
      message: "ロゴをアップロードできませんでした。もう一度お試しください。",
    };
  }

  const { data } = db.storage.from("material-images").getPublicUrl(path);

  return { ok: true as const, url: data.publicUrl };
}
