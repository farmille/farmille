import { fn } from "storybook/test";
export const beginCompanyApplication = fn<
  typeof import("@/server/company-applications").beginCompanyApplication
>(async () => ({
  access_id: "11111111-1111-4111-8111-111111111111",
  cleanup_claimed_at: "2026-09-15T09:00:00Z",
  content_hash: "",
  expires_at: "2026-09-15T09:00:00Z",
  id: "11111111-1111-4111-8111-111111111111",
  kind: "registration",
  seller_id: "00000000-0000-4000-8000-000000000201",
  submitted_at: "2026-09-15T09:00:00Z",
})).mockName("beginCompanyApplication");
export const saveCompanyApplication = fn<
  typeof import("@/server/company-applications").saveCompanyApplication
>(async () => "").mockName("saveCompanyApplication");
export const readCompanyApplication = fn<
  typeof import("@/server/company-applications").readCompanyApplication
>(async () => ({
  application: {
    access_id: "11111111-1111-4111-8111-111111111111",
    account_id: "11111111-1111-4111-8111-111111111111",
    application_date: "2026-09-15T09:00:00Z",
    company_name: "グリーンバイオ株式会社",
    contact_name: "山田太郎",
    corporate_number: "1234567890123",
    department: "",
    email: "farmer@example.com",
    id: "11111111-1111-4111-8111-111111111111",
    kind: "registration",
    phone: "",
    receipt_number: 0,
    seller_id: "00000000-0000-4000-8000-000000000201",
    signer_name: "サンプル資材",
    submitted_at: "2026-09-15T09:00:00Z",
  },
  items: [],
  consents: [],
  evidence: [],
  delivery: {
    application_id: "11111111-1111-4111-8111-111111111111",
    attempts: 0,
    claimed_at: "2026-09-15T09:00:00Z",
    last_error_code: "",
    recipient: "",
    sent_at: "2026-09-15T09:00:00Z",
  },
  transferOut: {
    account_id: "11111111-1111-4111-8111-111111111111",
    application_id: "11111111-1111-4111-8111-111111111111",
    company_name: "グリーンバイオ株式会社",
    contact_name: "山田太郎",
    corporate_number: "1234567890123",
    department: "",
    destination_seller_id: "11111111-1111-4111-8111-111111111111",
    email: "farmer@example.com",
    kind: "registration",
    phone: "",
  },
  transferIn: {
    application_id: "11111111-1111-4111-8111-111111111111",
    background: "",
    kind: "registration",
  },
  removal: {
    application_id: "11111111-1111-4111-8111-111111111111",
    company_url: "https://example.com",
    kind: "registration",
  },
})).mockName("readCompanyApplication");
export const listCompanyApplications = fn<
  typeof import("@/server/company-applications").listCompanyApplications
>(async () => [
  {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "registration",
    receipt_number: 3,
    company_name: "グリーンバイオ株式会社",
    submitted_at: "2026-09-15T09:00:00Z",
    company_application_mail_deliveries: null,
  },
]).mockName("listCompanyApplications");
