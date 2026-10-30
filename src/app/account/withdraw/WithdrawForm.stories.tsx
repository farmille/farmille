import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WithdrawForm } from "./WithdrawForm";

const meta = {
  title: "Pages/account/withdraw/WithdrawForm",
  component: WithdrawForm,
} satisfies Meta<typeof WithdrawForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
