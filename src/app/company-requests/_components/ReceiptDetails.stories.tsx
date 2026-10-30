import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { applicationReceiptDocument } from "@/lib/company-application-receipt";
import { ReceiptDetails } from "./ReceiptDetails";
import {
  registrationReceipt,
  removalReceipt,
  transferInReceipt,
  transferOutReceipt,
} from "./story-fixtures";

const transferOut = applicationReceiptDocument(transferOutReceipt);

const meta = {
  title: "Pages/company-requests/ReceiptDetails",
  component: ReceiptDetails,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof ReceiptDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Registration: Story = {
  args: { receiptDocument: applicationReceiptDocument(registrationReceipt) },
};

/** 移行先企業を、申請者と同じ並びで載せる。 */
export const TransferOut: Story = {
  args: { receiptDocument: transferOut },
};

/** 移行の経緯の改行と、申請全体に付けた資料を載せる。 */
export const TransferIn: Story = {
  args: { receiptDocument: applicationReceiptDocument(transferInReceipt) },
};

/** 旧フォームDは添付資料が「なし」で、確認事項の欄を出さない。 */
export const Removal: Story = {
  args: {
    receiptDocument: applicationReceiptDocument(removalReceipt, {
      omitMissingCorporateNumber: true,
    }),
  },
};

/** 同意日時が変わったところで確認事項のまとまりを分け、まとまりの間を確認事項どうしより広く空ける。 */
export const TwoConsentGroups: Story = {
  args: {
    receiptDocument: {
      ...transferOut,
      consents: transferOut.consents.flatMap((group) => [
        { ...group, texts: group.texts.slice(0, 2) },
        { ...group, acceptedAt: "2026/10/08 14:20:05（日本時間）", texts: group.texts.slice(2, 4) },
      ]),
    },
  },
};
