import { fn } from "storybook/test";

export const listMaterialPageReviews = fn<
  typeof import("@/server/admin/material-page-review").listMaterialPageReviews
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      material_id: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-09-15T09:00:00Z",
      materials: { name: "土づくり微生物資材" },
      seller_accounts: null,
    },
  ],
})).mockName("listMaterialPageReviews");

export const listManufacturerProfileReviews = fn<
  typeof import("@/server/admin/material-page-review").listManufacturerProfileReviews
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-09-15T09:00:00Z",
      seller_accounts: { official_name: "グリーンバイオ株式会社" },
    },
  ],
})).mockName("listManufacturerProfileReviews");

export const reviewManufacturerProfile = fn<
  typeof import("@/server/admin/material-page-review").reviewManufacturerProfile
>(async () => ({ ok: true, data: "" })).mockName("reviewManufacturerProfile");

export const reviewMaterialPage = fn<
  typeof import("@/server/admin/material-page-review").reviewMaterialPage
>(async () => ({ ok: true, data: "" })).mockName("reviewMaterialPage");
