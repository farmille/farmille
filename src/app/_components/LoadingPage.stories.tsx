import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LoadingPage } from "./LoadingPage";

const meta = {
  title: "App/LoadingPage",
  component: LoadingPage,
  args: {
    title: "読み込み中",
    backHref: "/",
  },
} satisfies Meta<typeof LoadingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MaterialDetail: Story = {
  args: {
    title: "バチルス菌体資材 ツチイキル",
    backHref: "/search",
  },
};

export const ReportNew: Story = {
  args: {
    title: "使用レポートを投稿",
    backHref: "/materials/101",
  },
};
