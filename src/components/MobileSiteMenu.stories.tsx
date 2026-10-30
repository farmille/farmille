import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { MobileSiteMenu } from "./MobileSiteMenu";

const links = [
  { label: "資材をさがす", href: "/search", current: true },
  { label: "記事", href: "/articles", current: false },
  { label: "投稿する", href: "/post", current: false },
  { label: "メーカーの方へ", href: "/sellers", current: false },
];

const meta = {
  title: "Pages/Shared/MobileSiteMenu",
  component: MobileSiteMenu,
  args: { links, member: false },
} satisfies Meta<typeof MobileSiteMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const GuestOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "メニュー" }));
  },
};

export const MemberOpen: Story = {
  args: { member: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "メニュー" }));
  },
};
