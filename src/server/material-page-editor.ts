import { materialIllustrationUrl } from "@/lib/material-illustration";
import { materialSourceLinks } from "@/lib/material-links";
import * as v from "valibot";

import {
  MaterialPageContentSchema,
  type MaterialPageContent,
  type SaveMaterialPageSchema,
} from "@/lib/material-page-editor";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type MaterialPageBody = Pick<
  Database["public"]["Views"]["public_material_page_versions"]["Row"],
  "material_id" | "description" | "main_components" | "mechanism"
>;

export async function getPublishedMaterialPage(materialId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("public_material_page_versions")
    .select("id,material_id,description,main_components,mechanism,origin")
    .eq("material_id", materialId)
    .maybeSingle();
  if (error) throw new Error("公開中の製品情報を取得できませんでした。");
  if (!data) return null;
  if (!data.id) throw new Error("公開原稿の識別子がありません。");
  return {
    origin: v.parse(v.picklist(["manufacturer", "catalog"]), data.origin),
    ...(await getMaterialPageBody(data.id, data)),
  };
}

/** 読み取りもRLSを通し、公開版または有効な資材オーナー権限のある版だけを返す。 */
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
  if (!version.material_id) throw new Error("原稿の資材識別子がありません。");
  const [links, material, usages, timings, certifications, registrations, relatedCompanies] =
    await Promise.all([
      db.from("material_page_links").select("*").eq("version_id", versionId).order("sort_order"),
      db.from("materials").select("container_type_id").eq("id", version.material_id).single(),
      db.from("material_page_usages").select("*").eq("version_id", versionId).order("sort_order"),
      db.from("material_page_timings").select("timing").eq("version_id", versionId).order("timing"),
      db
        .from("material_page_certifications")
        .select("*")
        .eq("version_id", versionId)
        .order("sort_order"),
      db.from("material_page_registrations").select("*").eq("version_id", versionId),
      db
        .from("material_page_related_companies")
        .select("company_name")
        .eq("version_id", versionId)
        .order("sort_order"),
    ]);
  if (
    links.error ||
    material.error ||
    usages.error ||
    timings.error ||
    certifications.error ||
    registrations.error ||
    relatedCompanies.error
  ) {
    throw new Error("資材の原稿を取得できませんでした。再読み込みしてください。");
  }
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
    images: [],
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
  return { content, imageUrl: materialIllustrationUrl(material.data.container_type_id) };
}

export async function getMaterialEditor(materialId: string, sellerId: string) {
  const db = await createServerSupabase();
  const [material, grant, history] = await Promise.all([
    db
      .from("materials")
      .select(
        "id,name,container_type_id,manufacturer_name,description,main_components,mechanism,publication_status,published_page_version_id,content_revision,official_url,catalog_url,usage_text",
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
  const existingEvidence = await db
    .from("material_evidences")
    .select("evidence_type,title,file_url,external_url")
    .eq("material_id", materialId)
    .order("sort_order");
  if (existingEvidence.error) throw new Error("公開中のリンク・資料を取得できませんでした。");
  const latest = history.data[0];
  const editing =
    latest &&
    (["draft", "pending"].includes(latest.status) ||
      (["returned", "withdrawn"].includes(latest.status) &&
        latest.base_revision === material.data.content_revision));
  const sourceVersion = editing ? latest.id : material.data.published_page_version_id;
  const saved = sourceVersion ? await getMaterialPageVersion(sourceVersion) : null;
  const content: MaterialPageContent = saved?.content ?? {
    description: material.data.description ?? "",
    mainComponents: material.data.main_components ?? "",
    mechanism: material.data.mechanism ?? "",
    links: materialSourceLinks({ ...material.data, evidences: existingEvidence.data }).map(
      (link) => ({ ...link, group: null, trial: null }),
    ),
    images: [],
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
    imageUrl: materialIllustrationUrl(material.data.container_type_id),
    expectedVersion: latest?.status === "draft" ? latest.id : null,
    pendingVersion: latest?.status === "pending" ? latest.id : null,
  };
}

export async function saveMaterialPageVersion(input: v.InferOutput<typeof SaveMaterialPageSchema>) {
  const db = await createServerSupabase();
  return db.rpc("save_material_page_version", {
    p_material_id: input.materialId,
    p_expected_version: input.expectedVersion ?? undefined,
    p_content: input.content,
    p_submit: input.submit,
  });
}

export async function withdrawMaterialPageVersion(versionId: string) {
  const db = await createServerSupabase();
  return db.rpc("withdraw_material_page_version", { p_version_id: versionId });
}

export async function hideOwnedMaterialPage(materialId: string, note: string) {
  const db = await createServerSupabase();
  return db.rpc("hide_owned_material_page", { p_material_id: materialId, p_note: note });
}
