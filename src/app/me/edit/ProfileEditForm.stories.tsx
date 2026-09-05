import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ownProfile } from "../_components/story-fixtures";
import { ProfileEditForm } from "./ProfileEditForm";

const meta = {
  title: "App/Me/ProfileEditForm",
  component: ProfileEditForm,
  args: { profile: ownProfile },
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
