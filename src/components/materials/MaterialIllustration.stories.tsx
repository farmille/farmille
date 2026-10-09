import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialIllustration } from "./MaterialIllustration";

const meta = {
  title: "Materials/MaterialIllustration",
  component: MaterialIllustration,
  args: { imageUrl: "/images/container-shapes/5.png" },
} satisfies Meta<typeof MaterialIllustration>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Bottle: Story = {};
export const Unclassified: Story = { args: { imageUrl: null } };
