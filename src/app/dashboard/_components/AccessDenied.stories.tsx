import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SellerAccessDenied } from "./AccessDenied";

const meta = {
  title: "App/Dashboard/SellerAccessDenied",
  component: SellerAccessDenied,
  args: { backHref: "/" },
} satisfies Meta<typeof SellerAccessDenied>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
