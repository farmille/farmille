import { fn } from "storybook/test";
import { registrationReceipt } from "@/app/company-requests/_components/story-fixtures";
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
>(async () => registrationReceipt).mockName("readCompanyApplication");
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
