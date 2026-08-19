import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileHeader } from "./ProfileHeader";
import { publicProfile } from "./story-fixtures";

const meta = {
  title: "App/Users/ProfileHeader",
  component: ProfileHeader,
  args: { profile: publicProfile, prefectureName: "東京都" },
} satisfies Meta<typeof ProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const Minimal: Story = {
  args: {
    profile: {
      ...publicProfile,
      bio: null,
      cultivationStyles: [],
      affiliation: null,
      websiteUrl: null,
      snsUrl: null,
      crops: [],
    },
    prefectureName: null,
  },
};
