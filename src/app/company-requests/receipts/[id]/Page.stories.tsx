import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";
import { readCompanyApplication } from "@/server/company-applications";
import Page from "./page";
import { removalReceipt } from "../../_components/story-fixtures";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/company-requests/receipts/[id]",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: { pathname: "/company-requests/receipts/11111111-1111-4111-8111-111111111111" },
    },
  },
  args: { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
/** この画面で開くのは、旧フォームD（終売・非表示）の受付票だけ。 */
export const Default: Story = {
  beforeEach: () => {
    mocked(readCompanyApplication).mockResolvedValue(removalReceipt);
  },
};
