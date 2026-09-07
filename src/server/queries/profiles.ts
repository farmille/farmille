import type { SupabaseClient } from "@supabase/supabase-js";

import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { AVATAR_MAX_BYTES } from "@/lib/avatar-rules";
import { trimmedFormDataString } from "@/lib/validation";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type OwnProfile = {
  userId: string;
  handle: string;
  avatarUrl: string | null;
};

export type ProfileUpdateInput = {
  handle: string;
};

export type ProfileUpdateFieldErrors = Partial<Record<"handle" | "avatar", string>>;

export type ProfileUpdateValidation =
  | { ok: true; input: ProfileUpdateInput }
  | { ok: false; fieldErrors: ProfileUpdateFieldErrors };

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

async function isHandleTakenByOther(
  supabase: SupabaseClient<Database>,
  handle: string,
  userId: string,
): Promise<Result<boolean>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("handle", handle)
    .neq("user_id", userId)
    .maybeSingle();

  if (error !== null) {
    reportQueryError("ハンドル重複確認に失敗", error);
    return fail("internal");
  }

  return succeed(data !== null);
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

  if (profileData === null) {
    return fail("not_found");
  }

  const profile: Pick<ProfileRow, "user_id" | "handle" | "avatar_url"> = profileData;

  return succeed({
    userId: profile.user_id,
    handle: profile.handle,
    avatarUrl: profile.avatar_url,
  });
}

export function validateProfileUpdate(raw: {
  handle: FormDataEntryValue | null;
}): ProfileUpdateValidation {
  const handle = trimmedFormDataString(raw.handle);

  if (handle.length === 0) {
    return { ok: false, fieldErrors: { handle: "ハンドルネームを入力してください。" } };
  }

  if (handle.length > HANDLE_MAX_LENGTH) {
    return {
      ok: false,
      fieldErrors: {
        handle: `ハンドルネームは${HANDLE_MAX_LENGTH}文字以内で入力してください。`,
      },
    };
  }

  return { ok: true, input: { handle } };
}

/** 本人のハンドルネームを更新する。 */
export async function updateOwnProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();

  const handleTaken = await isHandleTakenByOther(supabase, input.handle, userId);
  if (!handleTaken.ok) return handleTaken;
  if (handleTaken.data) return fail("handle_taken");

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ handle: input.handle })
    .eq("user_id", userId);

  if (updateError !== null) {
    if (updateError.code === "23505") return fail("handle_taken");
    reportQueryError("表示情報の更新に失敗", updateError);
    return fail("internal");
  }

  return succeed(null);
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
