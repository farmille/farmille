import { fn } from "storybook/test";
export const getSellerDashboardData = fn<
  typeof import("@/server/queries/seller-dashboard").getSellerDashboardData
>(async () => ({
  ok: true,
  data: {
    seller: {
      id: "00000000-0000-4000-8000-000000000201",
      status: "approved",
      contact_name: "山田太郎",
      logo_url: null,
      profile_text: null,
      website_url: null,
      manufacturer_name: null,
      official_name: "グリーンバイオ株式会社",
      approved_at: null,
      contact_email: "info@example.com",
      location: null,
      login_id: "greenbio",
      region_scope: null,
    },
    materials: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "土づくり微生物資材",
        manufacturer_name: "グリーンバイオ株式会社",
        avg_rating: null,
        manufacturer_verified_at: null,
        publication_status: "published",
        container_type_id: 1,
      },
    ],
  },
})).mockName("getSellerDashboardData");
export const getSellerMaterialsPageData = fn<
  typeof import("@/server/queries/seller-dashboard").getSellerMaterialsPageData
>(async () => ({
  ok: true,
  data: {
    sellerName: "グリーンバイオ株式会社",
    materials: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "土づくり微生物資材",
        manufacturer_name: "グリーンバイオ株式会社",
        avg_rating: null,
        manufacturer_verified_at: null,
        publication_status: "published",
        container_type_id: 1,
      },
    ],
    changeRequests: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        created_at: "2026-09-15T09:00:00Z",
        updated_at: "2026-09-15T09:00:00Z",
        material_id: null,
        status: "pending",
        submitted_at: "2026-09-15T09:00:00Z",
        reason: null,
        review_note: null,
        reviewed_at: null,
        change_type: "update",
        result_material_id: null,
        materialName: "トマト",
      },
    ],
  },
})).mockName("getSellerMaterialsPageData");
export const getSellerMaterialChangeRequest = fn<
  typeof import("@/server/queries/seller-dashboard").getSellerMaterialChangeRequest
>(async () => ({
  ok: true,
  data: {
    request: {
      id: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-09-15T09:00:00Z",
      updated_at: "2026-09-15T09:00:00Z",
      material_id: null,
      status: "pending",
      submitted_at: "2026-09-15T09:00:00Z",
      reason: null,
      review_note: null,
      reviewed_at: null,
      change_type: "update",
      result_material_id: null,
      materialName: "トマト",
    },
    proposal: {
      catalog_url: null,
      composition_type_id: null,
      created_at: "2026-09-15T09:00:00Z",
      description: null,
      general_use: null,
      main_components: null,
      manufacturer_name: "グリーンバイオ株式会社",
      mechanism: null,
      name: "土づくり微生物資材",
      official_url: null,
      price_range: null,
      request_id: "11111111-1111-4111-8111-111111111111",
      sales_status: null,
      updated_at: "2026-09-15T09:00:00Z",
      usage_text: null,
    },
  },
})).mockName("getSellerMaterialChangeRequest");
