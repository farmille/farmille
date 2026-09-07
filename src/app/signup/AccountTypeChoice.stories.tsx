import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountTypeChoice } from "./AccountTypeChoice";

const meta = {
  title: "App/Auth/AccountTypeChoice",
  component: AccountTypeChoice,
} satisfies Meta<typeof AccountTypeChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
