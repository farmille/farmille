import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LinkList } from "./LinkList";

const meta = {
  title: "Components/Navigation/LinkList",
  component: LinkList,
  args: {
    title: "ログインとセキュリティ",
    items: [
      { href: "/account/password", label: "パスワードを変更" },
      { href: "/account/passkeys", label: "パスキーを管理" },
    ],
  },
} satisfies Meta<typeof LinkList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 見出しの補足と、行ごとの今の状態を添えた一覧。
export const WithDetail: Story = {
  args: {
    title: "本人情報",
    description: "サイトに公開されない情報です。都道府県は、プロフィールの地域として公開されます。",
    items: [{ href: "/account/contact", label: "氏名・住所・電話", detail: "山田 太郎・茨城県" }],
  },
};
