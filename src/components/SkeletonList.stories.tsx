import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SkeletonList } from "./SkeletonList";

const meta = {
  title: "Components/Feedback/SkeletonList",
  component: SkeletonList,
  args: { variant: "materials", label: "資材を読み込んでいます" },
} satisfies Meta<typeof SkeletonList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
