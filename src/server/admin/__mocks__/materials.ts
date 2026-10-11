import { fn } from "storybook/test";
import type { AdminMaterialDetail } from "@/server/admin/materials";

export const adminMaterialFixture: AdminMaterialDetail = {
  archived_at: null,
  avg_rating: 0,
  catalog_url: "https://example.com",
  composition_type_id: "11111111-1111-4111-8111-111111111111",
  container_type_id: 0,
  content_revision: 0,
  control_plot_ratio: 0,
  created_at: "2026-09-15T09:00:00Z",
  description: "定植後の生育を支える微生物資材です。",
  general_use: "定植前の土づくりに使います。",
  id: "11111111-1111-4111-8111-111111111111",
  main_components: "バチルス属菌",
  manufacturer_name: "グリーンバイオ株式会社",
  manufacturer_verification_method: "",
  manufacturer_verified_at: "2026-09-15T09:00:00Z",
  manufacturer_verified_by_seller_id: "11111111-1111-4111-8111-111111111111",
  mechanism: "根圏環境を整えます。",
  name: "土づくり微生物資材",
  name_reading: "サンプル資材",
  official_name: "グリーンバイオ株式会社",
  official_url: "https://example.com",
  price_range: "5,000円",
  publication_status: "published",
  published_page_version_id: "11111111-1111-4111-8111-111111111111",
  review_count: 0,
  sales_status: "販売中",
  seller_id: "00000000-0000-4000-8000-000000000201",
  updated_at: "2026-09-15T09:00:00Z",
  usage_text: "10aあたり1kgを施用します。",
  cropIds: [],
  effectIds: [],
  ingredientCategoryIds: [],
  ingredientIds: [],
  productTypeIds: [],
  searchTagIds: [],
  sellerName: "サンプル資材",
};

export const listAdminMaterials = fn<typeof import("@/server/admin/materials").listAdminMaterials>(
  async () => ({
    ok: true,
    data: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "土づくり微生物資材",
        seller_id: null,
        manufacturer_name: "グリーンバイオ株式会社",
        sales_status: null,
        manufacturer_verified_at: null,
        publication_status: "published",
        review_count: 3,
        productTypeNames: [],
        sellerName: null,
      },
    ],
  }),
).mockName("listAdminMaterials");
export const getAdminMaterial = fn<typeof import("@/server/admin/materials").getAdminMaterial>(
  async () => ({
    ok: true,
    data: adminMaterialFixture,
  }),
).mockName("getAdminMaterial");
export const createMaterial = fn<typeof import("@/server/admin/materials").createMaterial>(
  async () => ({ ok: true, data: { id: "11111111-1111-4111-8111-111111111111" } }),
).mockName("createMaterial");
export const updateMaterial = fn<typeof import("@/server/admin/materials").updateMaterial>(
  async () => ({ ok: true, data: null }),
).mockName("updateMaterial");
export const setMaterialSeller = fn<typeof import("@/server/admin/materials").setMaterialSeller>(
  async () => ({ ok: true, data: null }),
).mockName("setMaterialSeller");
export const setMaterialPublicationStatus = fn<
  typeof import("@/server/admin/materials").setMaterialPublicationStatus
>(async () => ({ ok: true, data: null })).mockName("setMaterialPublicationStatus");
