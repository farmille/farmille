import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { SaveControlState } from "../actions";
import { SaveControl } from "./SaveControl";

const toggleAction = fn(
  async (previous: SaveControlState): Promise<SaveControlState> => ({
    saved: !previous.saved,
  }),
);

const meta = {
  title: "Pages/materials/[id]/SaveControl",
  component: SaveControl,
  args: {
    materialId: "00000000-0000-4000-8000-000000000101",
    materialPath: "/materials/00000000-0000-4000-8000-000000000101",
    saved: false,
    toggleAction,
  },
} satisfies Meta<typeof SaveControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotSaved: Story = {};

export const Saved: Story = {
  args: { saved: true },
};

export const SignedOut: Story = {
  args: { saved: null, toggleAction: undefined },
};

export const Unavailable: Story = {
  args: { unavailable: true },
};
