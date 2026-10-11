import { fn } from "storybook/test";
import { adminMaterialFixture } from "./materials";
export const listMaterialChangeRequests = fn<
  typeof import("@/server/admin/material-change-requests").listMaterialChangeRequests
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      material_id: null,
      seller_id: "11111111-1111-4111-8111-111111111111",
      status: "pending",
      submitted_at: "2026-09-15T09:00:00Z",
      reason: null,
      change_type: "update",
      result_material_id: null,
      materialName: "トマト",
      sellerName: "グリーンバイオ株式会社",
    },
  ],
})).mockName("listMaterialChangeRequests");
export const getMaterialChangeRequest = fn<
  typeof import("@/server/admin/material-change-requests").getMaterialChangeRequest
>(async () => ({
  ok: true,
  data: {
    request: {
      base_content_revision: 0,
      change_type: "update",
      created_at: "2026-09-15T09:00:00Z",
      id: "11111111-1111-4111-8111-111111111111",
      material_id: "11111111-1111-4111-8111-111111111111",
      reason: "掲載情報を更新するため",
      result_material_id: "11111111-1111-4111-8111-111111111111",
      review_note: "掲載内容を確認しました。",
      reviewed_at: "2026-09-15T09:00:00Z",
      reviewed_by_user_id: "11111111-1111-4111-8111-111111111111",
      seller_id: "00000000-0000-4000-8000-000000000201",
      status: "pending",
      submitted_at: "2026-09-15T09:00:00Z",
      updated_at: "2026-09-15T09:00:00Z",
    },
    sellerName: "サンプル資材",
    proposal: {
      name: "土づくり微生物資材",
      manufacturerName: "サンプル資材",
      compositionTypeId: "11111111-1111-4111-8111-111111111111",
      salesStatus: "",
      description: "定植後の生育を支える微生物資材です。",
      generalUse: "",
      mainComponents: "バチルス属菌",
      mechanism: "根圏環境を整えます。",
      usageText: "",
      priceRange: "",
      officialUrl: "https://example.com",
      catalogUrl: "https://example.com",
      cropIds: [],
      effectIds: [],
      ingredientCategoryIds: [],
      ingredientIds: [],
      productTypeIds: [],
      searchTagIds: [],
      evidences: [],
    },
    current: adminMaterialFixture,
  },
})).mockName("getMaterialChangeRequest");
export const approveMaterialChangeRequest = fn<
  typeof import("@/server/admin/material-change-requests").approveMaterialChangeRequest
>(async () => ({
  ok: true,
  data: { materialId: "11111111-1111-4111-8111-111111111111" },
})).mockName("approveMaterialChangeRequest");
export const rejectMaterialChangeRequest = fn<
  typeof import("@/server/admin/material-change-requests").rejectMaterialChangeRequest
>(async () => ({ ok: true, data: null })).mockName("rejectMaterialChangeRequest");
