import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TourLabel } from "./TourLabel";

const meta = {
  title: "Components/Onboarding/TourLabel",
  component: TourLabel,
} satisfies Meta<typeof TourLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Profile: Story = { args: { section: 1 } };
