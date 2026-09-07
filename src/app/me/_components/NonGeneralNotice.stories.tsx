import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NonGeneralNotice } from "./NonGeneralNotice";

const meta = {
  title: "App/Me/NonGeneralNotice",
  component: NonGeneralNotice,
  args: { accountType: "seller" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NonGeneralNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Seller: Story = {};

export const Admin: Story = {
  args: { accountType: "admin" },
};

export const UnknownAccount: Story = {
  args: { accountType: null },
};
