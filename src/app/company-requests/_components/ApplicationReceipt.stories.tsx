import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ApplicationReceipt } from "./ApplicationReceipt";
const id = "11111111-1111-4111-8111-111111111111";
const meta = {
  title: "Pages/company-requests/ApplicationReceipt",
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
      items: [
        {
          id,
          application_id: id,
          material_id: null,
          material_name: "土づくりサポート",
          material_url: "",
          position: 0,
          company_application_relations: [],
          company_application_registration_items: {
            item_id: id,
            target: "new",
            official_url: "https://example.com",
          },
          company_application_transfer_in_items: null,
          company_application_removal_items: null,
          company_application_evidence_links: [],
        },
      ],
      consents: [],
      evidence: [
        {
          id,
          item_key: id,
          purpose: "package",
          file_name: "パッケージ資料.pdf",
          byte_size: 1024,
        },
      ],
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
