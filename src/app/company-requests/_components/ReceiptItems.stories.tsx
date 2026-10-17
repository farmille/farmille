import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { applicationReceiptDocument } from "@/lib/company-application-receipt";
import { ReceiptItems } from "./ReceiptItems";
import { registrationReceipt, removalReceipt, transferInReceipt } from "./story-fixtures";
const registration = applicationReceiptDocument(registrationReceipt);
const transferIn = applicationReceiptDocument(transferInReceipt);
const removal = applicationReceiptDocument(removalReceipt);
const meta = {
  title: "Pages/company-requests/ReceiptItems",
  component: ReceiptItems,
} satisfies Meta<typeof ReceiptItems>;
export default meta;
type Story = StoryObj<typeof meta>;
/** 掲載・権限申請は、資材ごとの申請内容を右の列に置く。 */
export const Registration: Story = {
  args: { items: registration.items, attachmentCount: registration.attachments.length },
};
/** 申請内容の列が無い申請は、資材名と項目だけを並べる。 */
export const TransferIn: Story = {
  args: { items: transferIn.items, attachmentCount: transferIn.attachments.length },
};
/** 申請理由の改行をそのまま見せる。 */
export const Removal: Story = {
  args: { items: removal.items, attachmentCount: removal.attachments.length },
};
