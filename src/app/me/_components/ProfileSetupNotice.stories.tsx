import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileSetupNotice } from "./ProfileSetupNotice";

const meta = {
  title: "Pages/me/ProfileSetupNotice",
  component: ProfileSetupNotice,
  args: { missing: ["bio", "crops", "links"] },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProfileSetupNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllMissing: Story = {
  args: { missing: ["bio", "crops", "affiliations", "links"] },
};

export const OneMissing: Story = {
  args: { missing: ["links"] },
};
