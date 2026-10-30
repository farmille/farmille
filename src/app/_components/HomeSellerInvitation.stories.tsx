import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeSellerInvitation } from "./HomeSellerInvitation";

const meta = {
  title: "Pages/Home/HomeSellerInvitation",
  component: HomeSellerInvitation,
} satisfies Meta<typeof HomeSellerInvitation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
