import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileCard } from "./ProfileCard";
import { ownProfile } from "./story-fixtures";

const meta = {
  title: "App/Me/ProfileCard",
  component: ProfileCard,
  args: { profile: ownProfile },
} satisfies Meta<typeof ProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
