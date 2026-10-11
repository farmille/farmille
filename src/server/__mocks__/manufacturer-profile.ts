import { fn } from "storybook/test";
export const getManufacturerProfileEditor = fn<
  typeof import("@/server/manufacturer-profile").getManufacturerProfileEditor
>(async () => ({
  seller: {
    id: "00000000-0000-4000-8000-000000000201",
    official_name: "グリーンバイオ株式会社",
    profile_text: "微生物の力を活かした資材を開発し、農家の土づくりを支えています。",
    logo_url: "",
    website_url: "https://example.com",
    region_scope: "関東",
  },
  versions: [],
})).mockName("getManufacturerProfileEditor");
export const getManufacturerProfileVersion = fn<
  typeof import("@/server/manufacturer-profile").getManufacturerProfileVersion
>(async () => ({
  base_logo_url: "https://example.com",
  base_profile_text: "",
  base_website_url: "https://example.com",
  created_at: "2026-09-15T09:00:00Z",
  id: "11111111-1111-4111-8111-111111111111",
  logo_url: "",
  profile_text: "微生物の力を活かした資材を開発し、農家の土づくりを支えています。",
  review_note: "掲載内容を確認しました。",
  reviewed_at: "2026-09-15T09:00:00Z",
  reviewed_by: "",
  seller_id: "00000000-0000-4000-8000-000000000201",
  status: "pending",
  website_url: "https://example.com",
  seller_accounts: { official_name: "グリーンバイオ株式会社", region_scope: "関東" },
})).mockName("getManufacturerProfileVersion");
