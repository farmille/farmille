import { fn } from "storybook/test";
export const approvedApplicationSeller = fn<
  typeof import("@/server/company-application-auth").approvedApplicationSeller
>(async () => ({
  seller: {
    approved_at: "2026-09-15T09:00:00Z",
    auth_user_id: "11111111-1111-4111-8111-111111111111",
    contact_email: "farmer@example.com",
    contact_name: "山田太郎",
    contact_phone: "0291234567",
    corporate_number: "1234567890123",
    created_at: "2026-09-15T09:00:00Z",
    id: "00000000-0000-4000-8000-000000000201",
    invite_code: "",
    location: "",
    login_id: "11111111-1111-4111-8111-111111111111",
    logo_url: null,
    manufacturer_name: "グリーンバイオ株式会社",
    material_request_notes: "",
    official_name: "グリーンバイオ株式会社",
    profile_text: "微生物の力を活かした資材を開発し、農家の土づくりを支えています。",
    region_scope: "関東",
    rejected_reason: "",
    status: "approved",
    updated_at: "2026-09-15T09:00:00Z",
    website_url: "https://example.com",
  },
  userId: "11111111-1111-4111-8111-111111111111",
})).mockName("approvedApplicationSeller");
export class ApplicationError extends Error {
  constructor(public code: import("@/server/errors").ErrorCode) {
    super(code);
  }
}
