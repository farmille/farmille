import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileHeader } from "./ProfileHeader";
import { publicProfile } from "./story-fixtures";

const meta = {
  title: "App/Users/ProfileHeader",
  component: ProfileHeader,
  args: { profile: publicProfile },
} satisfies Meta<typeof ProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
