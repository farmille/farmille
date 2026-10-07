import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { css, cx } from "../../../../../../styled-system/css";
import { ReviewForm } from "./ReviewForm";

const initialValues = {
  cropIds: ["crop-tomato"],
  rating: 4,
  body: "定植後の根の動きがよく、株ごとの生育差が小さくなりました。",
  pesticideAck: true,
  photos: [],
};

const fmDecorator: Decorator = (Story) => (
  <div className={cx("fm", css({ p: "4" }))}>{Story()}</div>
);

const meta = {
  title: "App/Materials/Review/ReviewForm",
  component: ReviewForm,
  decorators: [fmDecorator],
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
      },
      {
        id: "crop-pepper",
        name: "ピーマン",
        aliases: ["パプリカ"],
        groupName: "なす科果菜類",
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
      pesticideAck: false,
      photos: [],
    },
  },
};

const photoUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="240" height="180" fill="#9ccc65"/></svg>',
  );

export const WithPhotos: Story = {
  args: {
    mode: "edit",
    reviewId: "00000000-0000-4000-8000-000000000801",
    initialValues: {
      ...initialValues,
      photos: [
        { id: "photo-1", url: photoUrl, caption: "散布前の様子", sort_order: 0 },
        { id: "photo-2", url: photoUrl, caption: null, sort_order: 1 },
      ],
    },
  },
};
