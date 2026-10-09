import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buttonRecipe } from "@/components/Button";
import Link from "next/link";

import { DoneMessage } from "./DoneMessage";

const meta = {
  title: "CompanyApplications/DoneMessage",
  component: DoneMessage,
  args: { title: "ご申請を受け付けました" },
} satisfies Meta<typeof DoneMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = { args: { as: "h1", spacing: "compact" } };

export const WithActions: Story = {
  args: {
    spacing: "section",
    title: "申請を受け付けました",
    children: <p>内容を確認し、ご登録の連絡先メールアドレスへご案内します。</p>,
    actions: (
      <>
        <Link className={buttonRecipe({ variant: "primary" })} href="/sellers">
          メーカーの方へ に戻る
        </Link>
        <Link className={buttonRecipe({ variant: "ghost" })} href="/">
          ホームへ
        </Link>
      </>
    ),
  },
};
