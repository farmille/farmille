import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UiKitInteractiveDemos } from "./Interactive";

const meta = {
  title: "Pages/dev/ui/Interactive",
  component: UiKitInteractiveDemos,
} satisfies Meta<typeof UiKitInteractiveDemos>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
