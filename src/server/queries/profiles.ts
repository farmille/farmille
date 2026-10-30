import { AVATAR_MAX_BYTES } from "@/lib/avatar-rules";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type OwnProfile = {
  userId: string;
  handle: string;
  avatarUrl: string | null;
};

const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/profiles] ${operation}`, error);
}

function avatarExtension(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

/** マイページと表示情報編集で使う、本人の公開表示情報を取得する。 */
export async function getOwnProfile(userId: string): Promise<Result<OwnProfile>> {
  const supabase = await createServerSupabase();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, handle, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError !== null) {
    reportQueryError("本人の表示情報取得に失敗", profileError);

    return fail("internal");
  }

  const profile: Pick<ProfileRow, "user_id" | "handle" | "avatar_url"> | null = profileData;

  // 退会済みのプロフィールはニックネームを空けているので、本人の表示情報として扱わない。
  if (profile === null || profile.handle === null) {
    return fail("not_found");
  }

  return succeed({
    userId: profile.user_id,
    handle: profile.handle,
    avatarUrl: profile.avatar_url,
  });
}

/** アバターを Storage `avatars/{user_id}/…` に上げ、profiles.avatar_url を更新する。 */
export async function uploadOwnAvatar(userId: string, file: File): Promise<Result<string>> {
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    return fail("invalid_body");
  }

  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) {
    return fail("invalid_body");
  }

  const extension = avatarExtension(file.type);

  if (extension === null) {
    return fail("invalid_body");
  }

  const supabase = await createServerSupabase();
  const objectPath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("avatars").upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError !== null) {
    reportQueryError("アバターのアップロードに失敗", uploadError);

    return fail("internal");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(objectPath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("user_id", userId);

  if (updateError !== null) {
    reportQueryError("アバターURLの保存に失敗", updateError);

    return fail("internal");
  }

  return succeed(publicUrl);
}
