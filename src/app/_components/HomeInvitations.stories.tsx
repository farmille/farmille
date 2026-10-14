import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeInvitations } from "./HomeInvitations";
const meta = {
  title: "Pages/Home/HomeInvitations",
  component: HomeInvitations,
  args: { showSignup: true },
} satisfies Meta<typeof HomeInvitations>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Guest: Story = {};
export const SignedIn: Story = { args: { showSignup: false } };
