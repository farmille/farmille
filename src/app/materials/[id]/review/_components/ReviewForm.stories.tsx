import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewForm } from "./ReviewForm";

const initialValues = {
  cropIds: ["crop-tomato", "crop-pepper"],
  rating: 4,
  body: "定植後の根の動きがよく、株ごとの生育差が小さくなりました。",
  purchaseChannel: "direct" as const,
  hasControlPlot: true,
  pesticideAck: true,
  photos: [],
};

const meta = {
  title: "App/Materials/Review/ReviewForm",
  component: ReviewForm,
  args: {
    mode: "create",
    material: {
      id: "00000000-0000-4000-8000-000000000101",
      name: "土づくり微生物資材",
      manufacturerName: "グリーンバイオ株式会社",
    },
    userId: "00000000-0000-4000-8000-000000000901",
    crops: [
      {
        id: "crop-tomato",
        name: "トマト",
        aliases: ["ミニトマト"],
        groupName: "なす科果菜類",
        fromProfile: true,
      },
      {
        id: "crop-pepper",
        name: "ピーマン",
        aliases: ["パプリカ"],
        groupName: "なす科果菜類",
        fromProfile: false,
      },
    ],
    initialValues,
  },
} satisfies Meta<typeof ReviewForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};

export const Edit: Story = {
  args: {
    mode: "edit",
    reviewId: "00000000-0000-4000-8000-000000000801",
    existingReviewNotice: true,
  },
};

export const Blank: Story = {
  args: {
    initialValues: {
      cropIds: [],
      rating: 0,
      body: "",
      purchaseChannel: null,
      hasControlPlot: false,
      pesticideAck: false,
      photos: [],
    },
  },
};
