import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ApplicationReceipt } from "./ApplicationReceipt";
import {
  registrationReceipt,
  removalReceipt,
  transferInReceipt,
  transferOutReceipt,
} from "./story-fixtures";
const meta = {
  title: "Pages/company-requests/ApplicationReceipt",
  component: ApplicationReceipt,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof ApplicationReceipt>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Registration: Story = { args: { receipt: registrationReceipt } };
export const TransferOut: Story = { args: { receipt: transferOutReceipt } };
export const TransferIn: Story = { args: { receipt: transferInReceipt } };
/** 公開の受付票画面と同じく、旧フォームDの申請者には「法人番号：該当なし」を出さない。 */
export const Removal: Story = {
  args: { receipt: removalReceipt, hideMissingCorporateNumber: true },
};
