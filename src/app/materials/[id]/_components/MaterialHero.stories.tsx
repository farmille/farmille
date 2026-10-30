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
  title: "Pages/materials/[id]/MaterialHero",
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

export const ImageLoaded: Story = {
  args: {
    material: {
      ...materialDetail,
      imageUrl: "/images/container-shapes/5.png",
    },
  },
};

export const ImageLoadFailure: Story = {
  args: {
    material: {
      ...materialDetail,
      imageUrl: "/missing-material-image.png",
    },
  },
};

export const ContainerBag: Story = {
  args: { material: { ...materialDetail, imageUrl: "/images/container-shapes/2.png" } },
};

export const LongName: Story = {
  args: {
    material: {
      ...materialDetail,
      name: "光合成細菌・バチルス菌・トリコデルマ菌を配合した土壌改良用複合微生物資材 ツチイキルプレミアム 業務用20kg",
    },
  },
};
