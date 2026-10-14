import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileSetupForm } from "./ProfileSetupForm";

const meta = {
  title: "Pages/me/setup/ProfileSetupForm",
  component: ProfileSetupForm,
} satisfies Meta<typeof ProfileSetupForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
