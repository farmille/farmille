import { fn } from "storybook/test";

export const getPublishedMaterialPage = fn<
  typeof import("@/server/material-page-editor").getPublishedMaterialPage
>(async () => ({
  content: {
    description: "定植後の生育を支える微生物資材です。",
    mainComponents: "バチルス属菌",
    mechanism: "根圏環境を整えます。",
    links: [],
    images: [],
    usages: [],
    timings: [],
    certifications: [],
    registrations: [],
    relatedCompanies: [],
  },
  imageUrl: null,
  origin: "manufacturer",
})).mockName("getPublishedMaterialPage");

export const getMaterialPageVersion = fn<
  typeof import("@/server/material-page-editor").getMaterialPageVersion
>(async () => ({
  content: {
    description: "定植後の生育を支える微生物資材です。",
    mainComponents: "バチルス属菌",
    mechanism: "根圏環境を整えます。",
    links: [],
    images: [],
    usages: [],
    timings: [],
    certifications: [],
    registrations: [],
    relatedCompanies: [],
  },
  imageUrl: null,
  version: {
    base_revision: 0,
    catalog_import_run_id: "11111111-1111-4111-8111-111111111111",
    content_contract: 0,
    created_at: "2026-09-15T09:00:00Z",
    description: "定植後の生育を支える微生物資材です。",
    grant_id: "11111111-1111-4111-8111-111111111111",
    id: "11111111-1111-4111-8111-111111111111",
    main_components: "バチルス属菌",
    material_id: "11111111-1111-4111-8111-111111111111",
    mechanism: "根圏環境を整えます。",
    origin: "manufacturer",
    review_note: "掲載内容を確認しました。",
    reviewed_at: "2026-09-15T09:00:00Z",
    reviewed_by: "",
    seller_id: "00000000-0000-4000-8000-000000000201",
    status: "pending",
  },
})).mockName("getMaterialPageVersion");

export const getMaterialEditor = fn<
  typeof import("@/server/material-page-editor").getMaterialEditor
>(async () => ({
  material: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "土づくり微生物資材",
    container_type_id: 0,
    manufacturer_name: "グリーンバイオ株式会社",
    description: "定植後の生育を支える微生物資材です。",
    main_components: "バチルス属菌",
    mechanism: "根圏環境を整えます。",
    publication_status: "published",
    published_page_version_id: "11111111-1111-4111-8111-111111111111",
    content_revision: 0,
    official_url: "https://example.com",
    catalog_url: "https://example.com",
    usage_text: "10aあたり1kgを施用します。",
  },
  content: {
    description: "定植後の生育を支える微生物資材です。",
    mainComponents: "バチルス属菌",
    mechanism: "根圏環境を整えます。",
    links: [],
    images: [],
    usages: [],
    timings: [],
    certifications: [],
    registrations: [],
    relatedCompanies: [],
  },
  history: [],
  imageUrl: null,
  expectedVersion: "",
  pendingVersion: "",
})).mockName("getMaterialEditor");

export const saveMaterialPageVersion = fn<
  typeof import("@/server/material-page-editor").saveMaterialPageVersion
>(async () => ({
  data: "11111111-1111-4111-8111-111111111111",
  error: null,
  count: null,
  status: 200,
  statusText: "OK",
  success: true,
})).mockName("saveMaterialPageVersion");

export const withdrawMaterialPageVersion = fn<
  typeof import("@/server/material-page-editor").withdrawMaterialPageVersion
>(async () => ({
  data: undefined,
  error: null,
  count: null,
  status: 204,
  statusText: "No Content",
  success: true,
})).mockName("withdrawMaterialPageVersion");

export const hideOwnedMaterialPage = fn<
  typeof import("@/server/material-page-editor").hideOwnedMaterialPage
>(async () => ({
  data: undefined,
  error: null,
  count: null,
  status: 204,
  statusText: "No Content",
  success: true,
})).mockName("hideOwnedMaterialPage");
