import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountActions } from "./AccountActions";

const meta = {
  title: "App/Me/AccountActions",
  component: AccountActions,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
} satisfies Meta<typeof AccountActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
