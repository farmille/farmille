import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { applicationReceiptDocument } from "@/lib/company-application-receipt";
import { ReceiptSheet } from "./ReceiptSheet";
import {
  registrationReceipt,
  removalReceipt,
  transferInReceipt,
  transferOutReceipt,
} from "./story-fixtures";
import { css } from "../../../../styled-system/css";
const meta = {
  title: "Pages/company-requests/ReceiptSheet",
  component: ReceiptSheet,
  parameters: { nextjs: { appDirectory: true } },
  // 受付票の画面と同じく、読みやすい幅の列に置く。
  decorators: [
    (Story) => (
      <div className={css({ maxW: "content.reading", mx: "auto" })}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReceiptSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Registration: Story = {
  args: { receiptDocument: applicationReceiptDocument(registrationReceipt) },
};
export const TransferOut: Story = {
  args: { receiptDocument: applicationReceiptDocument(transferOutReceipt) },
};
export const TransferIn: Story = {
  args: { receiptDocument: applicationReceiptDocument(transferInReceipt) },
};
export const Removal: Story = {
  args: {
    receiptDocument: applicationReceiptDocument(removalReceipt, {
      omitMissingCorporateNumber: true,
    }),
  },
};
