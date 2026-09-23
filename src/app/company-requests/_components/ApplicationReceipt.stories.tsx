import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ApplicationReceipt } from "./ApplicationReceipt";
const id = "11111111-1111-4111-8111-111111111111";
const meta = {
  title: "CompanyApplications/Receipt",
  component: ApplicationReceipt,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    receipt: {
      application: {
        id,
        kind: "registration",
        seller_id: id,
        access_id: null,
        company_name: "農業資材株式会社",
        corporate_number: "1234567890123",
        account_id: "agri-maker",
        contact_name: "山田太郎",
        department: "管理部",
        email: "contact@example.com",
        phone: "03-0000-0000",
        signer_name: "山田太郎",
        application_date: "2026-09-23",
        receipt_number: 1,
        submitted_at: "2026-09-23T00:00:00Z",
      },
      items: [],
      consents: [],
      evidence: [],
      delivery: {
        application_id: id,
        recipient: "contact@example.com",
        attempts: 1,
        claimed_at: null,
        sent_at: null,
        last_error_code: "smtp_failed",
      },
      transferOut: null,
      transferIn: null,
      removal: null,
    },
  },
} satisfies Meta<typeof ApplicationReceipt>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PendingMail: Story = {};
