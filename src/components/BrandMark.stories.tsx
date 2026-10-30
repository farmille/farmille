import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./BrandMark";

const meta = { title: "Components/Display/BrandMark", component: BrandMark } satisfies Meta<
  typeof BrandMark
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
