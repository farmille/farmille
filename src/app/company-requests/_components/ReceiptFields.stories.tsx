import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { applicationReceiptDocument } from "@/lib/company-application-receipt";
import { ReceiptFields } from "./ReceiptFields";
import { registrationReceipt, removalReceipt } from "./story-fixtures";
const meta = {
  title: "Pages/company-requests/ReceiptFields",
  component: ReceiptFields,
} satisfies Meta<typeof ReceiptFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { fields: applicationReceiptDocument(registrationReceipt).applicant.details },
};
/** 長い URL は折り返し、回答の改行はそのまま見せる。 */
export const MultilineValue: Story = {
  args: { fields: applicationReceiptDocument(removalReceipt).items.flatMap((item) => item.fields) },
};
/** 受付日時などの要点は、項目名の列を狭くする。 */
export const Narrow: Story = {
  args: {
    labelWidth: "narrow",
    fields: [
      { label: "受付日時", value: "2026/10/15 10:23:45（日本時間）" },
      { label: "申請日", value: "2026年10月15日" },
      { label: "申請の種類", value: "資材掲載・資材オーナー権限申請フォーム" },
    ],
  },
};
/** 結びの欄では、項目名を値の上に置く。 */
export const FullWidthLabel: Story = {
  args: {
    labelWidth: "full",
    fields: [{ label: "控えメール送信先", value: "takahashi@hokuto-agri.example.com" }],
  },
};
