import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { SaveControlState } from "../actions";
import { MaterialHero } from "./MaterialHero";
import { materialDetail } from "./story-fixtures";

const imageRecord = {
  id: "00000000-0000-4000-8000-000000000799",
  image_type: "package",
  sort_order: 0,
};

const loadedImageUrl =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20118%20118%22%3E%3Crect%20width%3D%22118%22%20height%3D%22118%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%2259%22%20cy%3D%2259%22%20r%3D%2232%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

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

export const ImageLoaded: Story = {
  args: {
    material: {
      ...materialDetail,
      images: [{ ...imageRecord, url: loadedImageUrl }],
    },
  },
};

export const ImageLoadFailure: Story = {
  args: {
    material: {
      ...materialDetail,
      images: [{ ...imageRecord, url: "/missing-material-image.png" }],
    },
  },
};

export const MultipleImages: Story = {
  args: {
    material: {
      ...materialDetail,
      images: [
        { ...imageRecord, url: loadedImageUrl },
        {
          ...imageRecord,
          id: "00000000-0000-4000-8000-000000000798",
          url: loadedImageUrl,
          sort_order: 1,
        },
        {
          ...imageRecord,
          id: "00000000-0000-4000-8000-000000000797",
          url: loadedImageUrl,
          sort_order: 2,
        },
      ],
    },
  },
};

export const LongName: Story = {
  args: {
    material: {
      ...materialDetail,
      name: "光合成細菌・バチルス菌・トリコデルマ菌を配合した土壌改良用複合微生物資材 ツチイキルプレミアム 業務用20kg",
    },
  },
};
