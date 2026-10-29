import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WithdrawalNotes } from "./WithdrawalNotes";

const meta = {
  title: "Pages/account/withdraw/WithdrawalNotes",
  component: WithdrawalNotes,
} satisfies Meta<typeof WithdrawalNotes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
