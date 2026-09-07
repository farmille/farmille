import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionHeading } from "./SectionHeading";

const meta = {
  title: "Components/SectionHeading",
  component: SectionHeading,
  args: {
    title: "人気の資材",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    title: "人気の資材",
  },
};

export const StandardWithLink: Story = {
  args: {
    title: "新着レビュー",
    href: "/reviews",
  },
};

export const StandardWithCustomLinkLabel: Story = {
  args: {
    title: "おすすめのメーカー",
    href: "/makers",
    linkLabel: "メーカー一覧へ →",
  },
};

export const Numbered: Story = {
  args: {
    title: "資材を選ぶ",
    number: "1",
  },
};

export const NumberedFirst: Story = {
  args: {
    title: "圃場の状態を記録する",
    number: "1",
    first: true,
  },
};

export const NumberedWithSub: Story = {
  args: {
    title: "使用レポートを投稿する",
    number: "3",
    sub: "経過14日目",
  },
};

export const LongTitle: Story = {
  args: {
    title: "施設栽培のトマトにおける複数資材の同時使用に関する注意点まとめ",
    href: "/articles/123",
  },
};
