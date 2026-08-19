import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EditRequestActions } from "./RequestActions";

const meta = {
  title: "App/Admin/Materials/EditRequestActions",
  component: EditRequestActions,
  args: { requestId: "00000000-0000-4000-8000-000000000301" },
} satisfies Meta<typeof EditRequestActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
