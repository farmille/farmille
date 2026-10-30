import type * as v from "valibot";

import type { SaveManufacturerProfileSchema } from "@/lib/manufacturer-profile";
import { createServerSupabase } from "@/server/supabase";

export async function getManufacturerProfileEditor(sellerId: string) {
  const db = await createServerSupabase();

  const [seller, versions] = await Promise.all([
    db
      .from("seller_accounts")
      .select("id,official_name,profile_text,logo_url,website_url,region_scope")
      .eq("id", sellerId)
      .single(),
    db
      .from("manufacturer_profile_versions")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false }),
  ]);

  if (seller.error || versions.error)
    throw new Error("メーカープロフィールを取得できませんでした。");

  return { seller: seller.data, versions: versions.data };
}

export async function getManufacturerProfileVersion(id: string) {
  const db = await createServerSupabase();

  const { data, error } = await db
    .from("manufacturer_profile_versions")
    .select(
      "*,seller_accounts!manufacturer_profile_versions_seller_id_fkey(official_name,region_scope)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("保存したメーカープロフィールを取得できませんでした。");

  return data;
}

export async function saveManufacturerProfileVersion(
  input: v.InferOutput<typeof SaveManufacturerProfileSchema>,
) {
  const db = await createServerSupabase();

  return db.rpc("save_manufacturer_profile_version", {
    p_profile_text: input.content.profileText,
    p_logo_url: input.content.logoUrl,
    p_website_url: input.content.websiteUrl,
    p_submit: input.submit,
    p_expected_version: input.expectedVersion ?? undefined,
  });
}

export async function withdrawManufacturerProfileVersion(versionId: string) {
  const db = await createServerSupabase();

  return db.rpc("withdraw_manufacturer_profile_version", { p_version_id: versionId });
}
