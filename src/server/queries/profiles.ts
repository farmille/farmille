import type { SupabaseClient } from "@supabase/supabase-js";

import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { isCultivationStyle, type CultivationStyle } from "@/lib/cultivation-styles";
import { isPrefectureCode } from "@/lib/prefectures";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-field-limits";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export { PROFILE_FIELD_LIMITS } from "@/lib/profile-field-limits";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];

type ProfileCropQueryRow = {
  crop: Pick<CropRow, "id" | "name" | "sort_order"> | null;
};

export type OwnProfile = {
  userId: string;
  handle: string;
  prefectureCode: number;
  prefecturePublic: boolean;
  avatarUrl: string | null;
  bio: string | null;
  cultivationStyles: readonly CultivationStyle[];
  affiliation: string | null;
  websiteUrl: string | null;
  snsUrl: string | null;
  crops: ReadonlyArray<{ id: string; name: string }>;
};

export type ProfileUpdateInput = {
  handle: string;
  prefectureCode: number;
  prefecturePublic: boolean;
  bio: string | null;
  cultivationStyles: readonly CultivationStyle[];
  affiliation: string | null;
  websiteUrl: string | null;
  snsUrl: string | null;
  cropIds: readonly string[];
};

export type ProfileUpdateFieldErrors = Partial<
  Record<
    | "handle"
    | "prefectureCode"
    | "bio"
    | "cultivationStyles"
    | "affiliation"
    | "websiteUrl"
    | "snsUrl"
    | "cropIds"
    | "avatar",
    string
  >
>;

export type ProfileUpdateValidation =
  | { ok: true; input: ProfileUpdateInput }
  | { ok: false; fieldErrors: ProfileUpdateFieldErrors };

const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/profiles] ${operation}`, error);
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalHttpUrl(value: unknown, label: string): Result<string | null> {
  const text = toTrimmedString(value);
  if (text.length === 0) return succeed(null);

  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fail("invalid_body");
    }
    return succeed(url.toString());
  } catch {
    void label;
    return fail("invalid_body");
  }
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

/** 本人のプロフィール（編集・マイページ用。standpoint は返さない）。 */
export async function getOwnProfile(userId: string): Promise<Result<OwnProfile>> {
  const supabase = await createServerSupabase();
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id, handle, prefecture_code, prefecture_public, avatar_url, bio, cultivation_styles, affiliation, website_url, sns_url",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError !== null) {
    reportQueryError("本人プロフィールの取得に失敗", profileError);
    return fail("internal");
  }

  if (profileData === null) {
    return fail("not_found");
  }

  const profile: Pick<
    ProfileRow,
    | "user_id"
    | "handle"
    | "prefecture_code"
    | "prefecture_public"
    | "avatar_url"
    | "bio"
    | "cultivation_styles"
    | "affiliation"
    | "website_url"
    | "sns_url"
  > = profileData;

  const { data: cropData, error: cropError } = await supabase
    .from("profile_crops")
    .select(
      `
        crop:crops!profile_crops_crop_id_fkey (
          id,
          name,
          sort_order
        )
      `,
    )
    .eq("user_id", userId);

  if (cropError !== null) {
    reportQueryError("主な作目の取得に失敗", cropError);
    return fail("internal");
  }

  const cropRows: ProfileCropQueryRow[] = cropData;
  const crops: Array<{ id: string; name: string; sortOrder: number }> = [];

  for (const relation of cropRows) {
    if (relation.crop === null) {
      reportQueryError("主な作目の関連データが欠落", { userId });
      return fail("internal");
    }

    crops.push({
      id: relation.crop.id,
      name: relation.crop.name,
      sortOrder: relation.crop.sort_order,
    });
  }

  const cultivationStyles = (profile.cultivation_styles ?? []).filter(isCultivationStyle);

  return succeed({
    userId: profile.user_id,
    handle: profile.handle,
    prefectureCode: profile.prefecture_code,
    prefecturePublic: profile.prefecture_public,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    cultivationStyles,
    affiliation: profile.affiliation,
    websiteUrl: profile.website_url,
    snsUrl: profile.sns_url,
    crops: crops
      .toSorted(
        (left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
      )
      .map(({ id, name }) => ({ id, name })),
  });
}

export function validateProfileUpdate(raw: {
  handle: unknown;
  prefectureCode: unknown;
  prefecturePublic: unknown;
  bio: unknown;
  cultivationStyles: unknown;
  affiliation: unknown;
  websiteUrl: unknown;
  snsUrl: unknown;
  cropIds: unknown;
}): ProfileUpdateValidation {
  const fieldErrors: ProfileUpdateFieldErrors = {};

  const handle = toTrimmedString(raw.handle);
  if (handle.length === 0) {
    fieldErrors.handle = "ハンドルネームを入力してください。";
  } else if (handle.length > HANDLE_MAX_LENGTH) {
    fieldErrors.handle = `ハンドルネームは${HANDLE_MAX_LENGTH}文字以内で入力してください。`;
  }

  const prefectureCode = Number(toTrimmedString(raw.prefectureCode));
  if (!isPrefectureCode(prefectureCode)) {
    fieldErrors.prefectureCode = "都道府県を選択してください。";
  }

  const bioText = toTrimmedString(raw.bio);
  if (bioText.length > PROFILE_FIELD_LIMITS.bio) {
    fieldErrors.bio = `一言プロフィールは${PROFILE_FIELD_LIMITS.bio}文字以内で入力してください。`;
  }

  const affiliationText = toTrimmedString(raw.affiliation);
  if (affiliationText.length > PROFILE_FIELD_LIMITS.affiliation) {
    fieldErrors.affiliation = `所属は${PROFILE_FIELD_LIMITS.affiliation}文字以内で入力してください。`;
  }

  const rawStyles = Array.isArray(raw.cultivationStyles)
    ? raw.cultivationStyles
    : typeof raw.cultivationStyles === "string"
      ? [raw.cultivationStyles]
      : [];
  const cultivationStyles: CultivationStyle[] = [];
  for (const style of rawStyles) {
    if (typeof style !== "string" || !isCultivationStyle(style)) {
      fieldErrors.cultivationStyles = "栽培形態の選択が正しくありません。";
      break;
    }
    if (!cultivationStyles.includes(style)) {
      cultivationStyles.push(style);
    }
  }

  const websiteResult = parseOptionalHttpUrl(raw.websiteUrl, "ウェブサイト");
  if (!websiteResult.ok) {
    fieldErrors.websiteUrl = "ウェブサイトは http(s) のURLで入力してください。";
  }

  const snsResult = parseOptionalHttpUrl(raw.snsUrl, "SNS");
  if (!snsResult.ok) {
    fieldErrors.snsUrl = "SNSは http(s) のURLで入力してください。";
  }

  const rawCropIds = Array.isArray(raw.cropIds)
    ? raw.cropIds
    : typeof raw.cropIds === "string"
      ? [raw.cropIds]
      : [];
  const cropIds: string[] = [];
  for (const cropId of rawCropIds) {
    if (typeof cropId !== "string" || cropId.length === 0) {
      fieldErrors.cropIds = "主な作目の選択が正しくありません。";
      break;
    }
    if (!cropIds.includes(cropId)) {
      cropIds.push(cropId);
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  // 上で検証済みのため、ここでの Result は必ず成功する。
  const bio = bioText.length === 0 ? null : bioText;
  const affiliation = affiliationText.length === 0 ? null : affiliationText;

  return {
    ok: true,
    input: {
      handle,
      prefectureCode,
      prefecturePublic: raw.prefecturePublic === "on" || raw.prefecturePublic === true,
      bio,
      cultivationStyles,
      affiliation,
      websiteUrl: websiteResult.ok ? websiteResult.data : null,
      snsUrl: snsResult.ok ? snsResult.data : null,
      cropIds,
    },
  };
}

/** 本人プロフィールを更新する。standpoint は触らない。 */
export async function updateOwnProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();

  const handleTaken = await isHandleTakenByOther(supabase, input.handle, userId);
  if (!handleTaken.ok) return handleTaken;
  if (handleTaken.data) return fail("handle_taken");

  if (input.cropIds.length > 0) {
    const { data: crops, error: cropsError } = await supabase
      .from("crops")
      .select("id")
      .in("id", [...input.cropIds]);

    if (cropsError !== null) {
      reportQueryError("作目マスタの確認に失敗", cropsError);
      return fail("internal");
    }

    if (crops.length !== input.cropIds.length) {
      return fail("invalid_body");
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      handle: input.handle,
      prefecture_code: input.prefectureCode,
      prefecture_public: input.prefecturePublic,
      bio: input.bio,
      cultivation_styles: input.cultivationStyles.length > 0 ? [...input.cultivationStyles] : null,
      affiliation: input.affiliation,
      website_url: input.websiteUrl,
      sns_url: input.snsUrl,
    })
    .eq("user_id", userId);

  if (updateError !== null) {
    if (updateError.code === "23505") return fail("handle_taken");
    reportQueryError("プロフィール更新に失敗", updateError);
    return fail("internal");
  }

  const { error: deleteError } = await supabase
    .from("profile_crops")
    .delete()
    .eq("user_id", userId);

  if (deleteError !== null) {
    reportQueryError("主な作目の差し替え（削除）に失敗", deleteError);
    return fail("internal");
  }

  if (input.cropIds.length > 0) {
    const { error: insertError } = await supabase.from("profile_crops").insert(
      input.cropIds.map((cropId) => ({
        user_id: userId,
        crop_id: cropId,
      })),
    );

    if (insertError !== null) {
      reportQueryError("主な作目の差し替え（挿入）に失敗", insertError);
      return fail("internal");
    }
  }

  return succeed(null);
}

/** アバターを Storage `avatars/{user_id}/…` に上げ、profiles.avatar_url を更新する。 */
export async function uploadOwnAvatar(userId: string, file: File): Promise<Result<string>> {
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    return fail("invalid_body");
  }

  if (file.size <= 0 || file.size > PROFILE_FIELD_LIMITS.avatarMaxBytes) {
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
