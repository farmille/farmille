import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeConcept } from "./HomeConcept";

const meta = {
  title: "Pages/Home/HomeConcept",
  component: HomeConcept,
  parameters: { layout: "fullscreen" },
  args: { showSignup: true },
} satisfies Meta<typeof HomeConcept>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {};
export const SignedIn: Story = { args: { showSignup: false } };
