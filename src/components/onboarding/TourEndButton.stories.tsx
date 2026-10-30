import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { TourEndButton } from "./TourEndButton";

const meta = {
  title: "Components/Onboarding/TourEndButton",
  component: TourEndButton,
  args: { onEnd: fn() },
} satisfies Meta<typeof TourEndButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
