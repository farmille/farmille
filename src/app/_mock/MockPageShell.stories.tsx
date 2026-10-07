import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { getSessionUser } from "@/server/auth";

import { MockPageShell } from "./MockPageShell";

const meta = {
  title: "App/Mock/MockPageShell",
  component: MockPageShell,
  parameters: { layout: "fullscreen" },
  args: {
    title: "マイページ",
    backHref: "/",
    children: <p>本文の領域です。画面ごとの内容がここに入ります。</p>,
  },
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
} satisfies Meta<typeof MockPageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {};

export const Home: Story = {
  args: { title: undefined, backHref: undefined, showHeaderSearch: false },
};

export const WithFab: Story = {
  args: { hasFab: true, title: "土づくり微生物資材", backHref: "/search", shareHref: "/" },
};

export const WithoutFooter: Story = {
  args: { footer: false, active: "search" },
};

export const SignedIn: Story = {
  args: { active: "me" },
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-1",
      accountType: "general",
      sellerId: null,
      aal: "aal1",
    });
  },
};
