import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TextLink } from "./TextLink";

const meta = {
  title: "Components/TextLink",
  component: TextLink,
  args: {
    children: "資材の詳細を見る",
  },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Internal: Story = {
  args: {
    href: "/materials/bacillus-tsuchiikiru",
  },
};

export const External: Story = {
  args: {
    href: "https://green-bio.example.com/case-study",
    external: true,
    children: "グリーンバイオ株式会社の導入事例を見る（外部サイト）",
  },
};

export const LongLabel: Story = {
  args: {
    href: "/reports/tomato-field-2026",
    children: "施設栽培トマトでの実証詳細レポート（うどんこ病対策・定植前土壌灌注）をすべて見る",
  },
};

export const Plain: Story = {
  args: {
    href: "/password-reset",
    variant: "plain",
    children: "パスワードを忘れた方",
  },
};

export const Subtle: Story = {
  args: {
    href: "/me",
    variant: "subtle",
    children: "キャンセルしてマイページに戻る",
  },
};
