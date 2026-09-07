import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeSearchEntry } from "./HomeSearchEntry";

const meta = {
  title: "Components/Search/HomeSearchEntry",
  component: HomeSearchEntry,
} satisfies Meta<typeof HomeSearchEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
