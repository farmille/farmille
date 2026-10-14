import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RequestCancelButton } from "./RequestCancelButton";

const meta = {
  title: "Pages/dashboard/materials/requests/[id]/RequestCancelButton",
  component: RequestCancelButton,
  args: {
    requestId: "00000000-0000-4000-8000-000000000501",
  },
} satisfies Meta<typeof RequestCancelButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PendingRequest: Story = {};
