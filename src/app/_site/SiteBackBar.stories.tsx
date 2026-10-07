import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteBackBar } from "./SiteBackBar";

const meta = {
  title: "App/Site/SiteBackBar",
  component: SiteBackBar,
  args: { title: "マイページ", backHref: "/" },
} satisfies Meta<typeof SiteBackBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithShare: Story = {
  args: { title: "土づくり微生物資材", backHref: "/search", shareHref: "/materials/1" },
};

export const LongTitle: Story = {
  args: {
    title: "夏作トマトの定植前処理における根圏微生物資材の使用記録と対照区との比較",
    backHref: "/me",
    shareHref: "/reports/1",
  },
};
