import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ApplicationsContent } from "./ApplicationsContent";

const meta = {
  title: "Dashboard/ApplicationsContent",
  component: ApplicationsContent,
  args: {
    receipts: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        kind: "registration",
        receipt_number: 1,
        company_name: "農業資材株式会社",
        submitted_at: "2026-09-23T00:00:00Z",
        company_application_mail_deliveries: { sent_at: null, last_error_code: null },
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        kind: "transfer_in",
        receipt_number: 2,
        company_name: "農業資材株式会社",
        submitted_at: "2026-09-24T00:00:00Z",
        company_application_mail_deliveries: { sent_at: null, last_error_code: null },
      },
    ],
  },
} satisfies Meta<typeof ApplicationsContent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { receipts: [] } };
