import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialPageSkeleton } from "./MaterialPageSkeleton";
const meta = {
  title: "Pages/materials/[id]/MaterialPageSkeleton",
  component: MaterialPageSkeleton,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MaterialPageSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
