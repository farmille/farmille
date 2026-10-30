import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TourSaved } from "./TourSaved";

const meta = {
  title: "Components/Onboarding/TourSaved",
  component: TourSaved,
} satisfies Meta<typeof TourSaved>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Profile: Story = { args: { title: "プロフィールを保存しました" } };
