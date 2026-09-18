import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PreparationNotice } from "./PreparationNotice";

const meta = {
  title: "Components/PreparationNotice",
  component: PreparationNotice,
} satisfies Meta<typeof PreparationNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
