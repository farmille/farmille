import { materialSourceLinks } from "@/lib/material-links";
import * as v from "valibot";

import { MaterialPageContentSchema, type MaterialPageContent } from "@/lib/material-page-editor";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type MaterialPageBody = Pick<
  Database["public"]["Views"]["public_material_page_versions"]["Row"],
  "description" | "main_components" | "mechanism"
>;

export async function getPublishedMaterialPage(materialId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("public_material_page_versions")
    .select("id,description,main_components,mechanism")
    .eq("material_id", materialId)
    .maybeSingle();
  if (error) throw new Error("公開中の製品情報を取得できませんでした。");
  if (!data) return null;
  if (!data.id) throw new Error("公開原稿の識別子がありません。");
  return getMaterialPageBody(data.id, data);
}

/** 読み取りもRLSを通し、公開版または有効な編集権のある版だけを返す。 */
export async function getMaterialPageVersion(versionId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("material_page_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();
  if (error) throw new Error("原稿履歴を取得できませんでした。");
  if (!data) return null;
  return { version: data, ...(await getMaterialPageBody(versionId, data)) };
}

async function getMaterialPageBody(versionId: string, version: MaterialPageBody) {
  const db = await createServerSupabase();
  const [
    links,
    images,
    usages,
    timings,
    certifications,
    existingImages,
    registrations,
    relatedCompanies,
  ] = await Promise.all([
    db.from("material_page_links").select("*").eq("version_id", versionId).order("sort_order"),
    db.from("material_page_images").select("*").eq("version_id", versionId).order("sort_order"),
    db.from("material_page_usages").select("*").eq("version_id", versionId).order("sort_order"),
    db.from("material_page_timings").select("timing").eq("version_id", versionId).order("timing"),
    db
      .from("material_page_certifications")
      .select("*")
      .eq("version_id", versionId)
      .order("sort_order"),
    db
      .from("material_page_existing_images")
      .select(
        "image_id,alt,sort_order,material_images!material_page_existing_images_image_id_fkey(url)",
      )
      .eq("version_id", versionId),
    db.from("material_page_registrations").select("*").eq("version_id", versionId),
    db
      .from("material_page_related_companies")
      .select("company_name")
      .eq("version_id", versionId)
      .order("sort_order"),
  ]);
  if (
    links.error ||
    images.error ||
    usages.error ||
    timings.error ||
    certifications.error ||
    existingImages.error ||
    registrations.error ||
    relatedCompanies.error
  ) {
    throw new Error("資材の原稿を取得できませんでした。再読み込みしてください。");
  }
  const allImages = [
    ...images.data.map((row) => ({
      id: row.id,
      path: row.storage_path,
      alt: row.alt,
      sort_order: row.sort_order,
      url: `/api/material-images/${row.id}`,
    })),
    ...existingImages.data.map((row) => {
      if (!row.material_images) throw new Error("原稿に保存された既存画像が見つかりません。");
      return {
        id: row.image_id,
        path: `legacy:${row.image_id}`,
        alt: row.alt,
        sort_order: row.sort_order,
        url: row.material_images.url,
      };
    }),
  ].sort((a, b) => a.sort_order - b.sort_order);
  const content = v.parse(MaterialPageContentSchema, {
    description: version.description,
    mainComponents: version.main_components,
    mechanism: version.mechanism,
    links: links.data.map((row) => ({
      group: row.group_name,
      title: row.title,
      url: row.url,
      trial:
        row.group_name === "public_trial" || row.group_name === "other_trial"
          ? {
              crops: row.trial_crops ?? "",
              summary: row.trial_summary ?? "",
              institution: row.trial_institution ?? "",
              year: row.trial_year,
              pageCount: row.trial_page_count,
            }
          : null,
    })),
    images: allImages.map((row) => ({ path: row.path, alt: row.alt })),
    usages: usages.data.map((row) => ({ method: row.method, detail: row.detail })),
    timings: timings.data.map((row) => row.timing),
    certifications: certifications.data.map((row) => row.title),
    registrations: registrations.data.map((row) => ({
      kind: row.kind,
      companyName: row.company_name,
      effects: row.effects,
    })),
    relatedCompanies: relatedCompanies.data.map((row) => row.company_name),
  });
  return { content, images: allImages };
}

export async function getMaterialEditor(materialId: string, sellerId: string) {
  const db = await createServerSupabase();
  const [material, grant, history] = await Promise.all([
    db
      .from("materials")
      .select(
        "id,name,manufacturer_name,description,main_components,mechanism,publication_status,published_page_version_id,content_revision,official_url,catalog_url,usage_text",
      )
      .eq("id", materialId)
      .maybeSingle(),
    db
      .from("material_editor_grants")
      .select("id")
      .eq("material_id", materialId)
      .eq("seller_id", sellerId)
      .is("revoked_at", null)
      .maybeSingle(),
    db
      .from("material_page_versions")
      .select("id,status,created_at,reviewed_at,review_note,base_revision")
      .eq("material_id", materialId)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false }),
  ]);
  if (material.error || grant.error || history.error)
    throw new Error("資材の編集情報を取得できませんでした。");
  if (!material.data || !grant.data) return null;
  const materialName = material.data.name;
  const existingImages = await db
    .from("material_images")
    .select("id,url")
    .eq("material_id", materialId)
    .eq("is_current", true)
    .order("sort_order");
  if (existingImages.error) throw new Error("公開中の製品画像を取得できませんでした。");
  const existingEvidence = await db
    .from("material_evidences")
    .select("evidence_type,title,file_url,external_url")
    .eq("material_id", materialId)
    .order("sort_order");
  if (existingEvidence.error) throw new Error("公開中のリンク・資料を取得できませんでした。");
  const latest = history.data[0];
  const saved = latest
    ? await getMaterialPageVersion(latest.id)
    : await getPublishedMaterialPage(materialId);
  const content: MaterialPageContent = saved?.content ?? {
    description: material.data.description ?? "",
    mainComponents: material.data.main_components ?? "",
    mechanism: material.data.mechanism ?? "",
    links: materialSourceLinks({ ...material.data, evidences: existingEvidence.data }).map(
      (link) => ({ ...link, group: null, trial: null }),
    ),
    images: existingImages.data.map((image) => ({ path: `legacy:${image.id}`, alt: materialName })),
    timings: [],
    certifications: [],
    registrations: [],
    relatedCompanies: [material.data.manufacturer_name],
    usages: material.data.usage_text ? [{ method: "other", detail: material.data.usage_text }] : [],
  };
  return {
    material: material.data,
    content,
    history: history.data,
    imageSources:
      saved?.images.map((image) => image.url) ?? existingImages.data.map((image) => image.url),
    expectedVersion: latest?.status === "draft" ? latest.id : null,
    pendingVersion: latest?.status === "pending" ? latest.id : null,
  };
}
