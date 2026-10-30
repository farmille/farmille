import { fn } from "storybook/test";

export function isSellerStatus(
  value: string | null | undefined,
): value is import("@/server/admin/sellers").SellerStatus {
  return (
    value === "applied" || value === "approved" || value === "rejected" || value === "suspended"
  );
}

export const listSellers = fn<typeof import("@/server/admin/sellers").listSellers>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-09-15T09:00:00Z",
      status: "applied",
      official_name: "グリーンバイオ株式会社",
      approved_at: null,
      login_id: "greenbio",
    },
  ],
})).mockName("listSellers");

export const getSellerDetail = fn<typeof import("@/server/admin/sellers").getSellerDetail>(
  async () => ({
    ok: true,
    data: {
      approved_at: null,
      auth_user_id: null,
      contact_email: "info@example.com",
      contact_name: "山田太郎",
      contact_phone: null,
      corporate_number: null,
      created_at: "2026-09-15T09:00:00Z",
      id: "11111111-1111-4111-8111-111111111111",
      invite_code: null,
      location: null,
      login_id: "greenbio",
      logo_url: null,
      manufacturer_name: null,
      material_request_notes: null,
      official_name: "グリーンバイオ株式会社",
      profile_text: null,
      region_scope: null,
      rejected_reason: null,
      status: "applied",
      updated_at: "2026-09-15T09:00:00Z",
      website_url: null,
      materialCount: 3,
    },
  }),
).mockName("getSellerDetail");

export const approveSellerApplication = fn<
  typeof import("@/server/admin/sellers").approveSellerApplication
>(async () => ({
  ok: true,
  data: {
    loginId: "11111111-1111-4111-8111-111111111111",
    passwordSetupUrl: "https://example.com",
    emailSent: false,
  },
})).mockName("approveSellerApplication");

export const listManufacturerNames = fn<
  typeof import("@/server/admin/sellers").listManufacturerNames
>(async () => ({ ok: true, data: ["内容を確認してください。"] })).mockName("listManufacturerNames");

export const listSellerMaterialCandidates = fn<
  typeof import("@/server/admin/sellers").listSellerMaterialCandidates
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "土づくり微生物資材",
      manufacturer_name: "グリーンバイオ株式会社",
      seller_id: null,
      publication_status: "published",
    },
  ],
})).mockName("listSellerMaterialCandidates");

export const rejectSellerApplication = fn<
  typeof import("@/server/admin/sellers").rejectSellerApplication
>(async () => ({ ok: true, data: null })).mockName("rejectSellerApplication");

export const suspendSellerAccount = fn<
  typeof import("@/server/admin/sellers").suspendSellerAccount
>(async () => ({ ok: true, data: null })).mockName("suspendSellerAccount");

export const reinstateSellerAccount = fn<
  typeof import("@/server/admin/sellers").reinstateSellerAccount
>(async () => ({ ok: true, data: null })).mockName("reinstateSellerAccount");

export const issueSellerInviteCode = fn<
  typeof import("@/server/admin/sellers").issueSellerInviteCode
>(async () => ({ ok: true, data: { inviteCode: "" } })).mockName("issueSellerInviteCode");

export const listClaimableSellers = fn<
  typeof import("@/server/admin/sellers").listClaimableSellers
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      official_name: "グリーンバイオ株式会社",
      login_id: "greenbio",
    },
  ],
})).mockName("listClaimableSellers");

export const SELLER_STATUSES: typeof import("@/server/admin/sellers").SELLER_STATUSES = [
  "applied",
  "approved",
  "rejected",
  "suspended",
];

export const SELLER_STATUS_LABELS: typeof import("@/server/admin/sellers").SELLER_STATUS_LABELS = {
  applied: "確認中",
  approved: "確認済み",
  rejected: "却下",
  suspended: "凍結中",
};
