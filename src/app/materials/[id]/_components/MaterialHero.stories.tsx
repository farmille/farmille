import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { SaveControlState } from "../actions";
import { MaterialHero } from "./MaterialHero";
import { materialDetail } from "./story-fixtures";

const toggleAction = fn(
  async (previous: SaveControlState): Promise<SaveControlState> => ({
    saved: !previous.saved,
  }),
);

const meta = {
  title: "App/Materials/MaterialHero",
  component: MaterialHero,
  args: {
    material: materialDetail,
    saved: false,
    toggleAction,
  },
} satisfies Meta<typeof MaterialHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const SignedOut: Story = {
  args: { saved: null, toggleAction: undefined },
};

export const SellerAccount: Story = {
  args: { saveUnavailable: true },
};
