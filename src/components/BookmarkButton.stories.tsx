import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookmarkButton } from "./BookmarkButton";

const meta = {
  title: "Components/Actions/BookmarkButton",
  component: BookmarkButton,
  args: { saved: false, action: async (saved: boolean) => saved },
} satisfies Meta<typeof BookmarkButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saved: Story = { args: { saved: true } };
export const Disabled: Story = { args: { action: undefined } };
