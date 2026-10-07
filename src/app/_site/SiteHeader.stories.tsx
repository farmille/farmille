import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { getSessionUser } from "@/server/auth";

import { SiteHeader } from "./SiteHeader";

const meta = {
  title: "App/Site/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};

export const SearchActive: Story = {
  args: { active: "search", searchQuery: "トマト" },
};

export const WithoutSearch: Story = {
  args: { showSearch: false },
};

export const GeneralUser: Story = {
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

export const Seller: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-2",
      accountType: "seller",
      sellerId: "seller-1",
      aal: "aal1",
    });
  },
};
