import type { ProfileDetailsInput } from "@/lib/profile-details";
import { selectAllRows } from "@/server/pagination";
import { createServerSupabase } from "@/server/supabase";
import { fail, succeed, type Result } from "@/server/result";

/** 公開可能な情報だけを取得する。市区町村の公開判定はDBビューが行う。 */
export async function getProfileDetails(userId: string) {
  const supabase = await createServerSupabase();
  const [profile, details, affiliations, crops, links] = await Promise.all([
    supabase
      .from("public_profiles")
      .select("standpoint,prefecture_code,bio,city")
      .eq("user_id", userId)
      .single(),
    supabase.from("profile_details").select("city_public").eq("user_id", userId).maybeSingle(),
    supabase.from("profile_affiliations").select("name").eq("user_id", userId).order("sort_order"),
    supabase
      .from("profile_crops")
      .select("crop_id,crops(id,name,aliases)")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase.from("profile_links").select("url").eq("user_id", userId).order("sort_order"),
  ]);
  const errors = [
    profile.error,
    details.error,
    affiliations.error,
    crops.error,
    links.error,
  ].filter(Boolean);
  if (
    errors.length > 0 ||
    profile.data === null ||
    affiliations.data === null ||
    crops.data === null ||
    links.data === null
  ) {
    console.error("[profile-details] プロフィールの取得に失敗", errors);
    return fail("internal");
  }
  return succeed({
    ...profile.data,
    cityPublic: details.data?.city_public ?? false,
    affiliations: affiliations.data.map((row) => row.name),
    crops: crops.data.map((row) => row.crops),
    links: links.data.map((row) => row.url),
  });
}
export type ProfileDetails = Extract<
  Awaited<ReturnType<typeof getProfileDetails>>,
  { ok: true }
>["data"];

export async function getProfileOptions() {
  const supabase = await createServerSupabase();
  const [crops, affiliations] = await Promise.all([
    selectAllRows((from, to) =>
      supabase
        .from("crops")
        .select("id,name,aliases,crop_groups(name)")
        .eq("is_active", true)
        .order("sort_order")
        .order("name")
        .order("id")
        .range(from, to),
    ),
    supabase.from("affiliation_options").select("name").order("sort_order").order("name"),
  ]);
  if (crops.error || affiliations.error) {
    console.error("[profile-details] 選択肢の取得に失敗", crops.error, affiliations.error);
    return fail("internal");
  }
  return succeed({ crops: crops.data, affiliations: affiliations.data.map((row) => row.name) });
}
export type ProfileOptions = Extract<
  Awaited<ReturnType<typeof getProfileOptions>>,
  { ok: true }
>["data"];

/** 本人の情報と複数のタグを同一トランザクションで保存する。 */
export async function saveProfileDetails(input: ProfileDetailsInput): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("save_profile_details", {
    p_handle: input.handle,
    p_bio: input.bio,
    p_city_public: input.cityPublic,
    p_affiliations: input.affiliations,
    p_crop_ids: input.cropIds,
    p_links: input.links,
  });
  if (error) {
    if (error.code === "23505") return fail("handle_taken");
    console.error("[profile-details] 保存に失敗", error);
    return fail("internal");
  }
  return succeed(null);
}
