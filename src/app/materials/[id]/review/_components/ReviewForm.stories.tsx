import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";

import { createReviewAction } from "@/app/materials/[id]/review/actions";
import { css } from "../../../../../../styled-system/css";
import { ReviewForm } from "./ReviewForm";

const initialValues = {
  cropIds: ["crop-tomato"],
  rating: 4,
  body: "定植後の根の動きがよく、株ごとの生育差が小さくなりました。",
  pesticideAck: true,
  photos: [],
};

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "Pages/materials/[id]/review/ReviewForm",
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

export const SubmitsCropAndRating: Story = {
  args: {
    initialValues: {
      cropIds: [],
      rating: 0,
      body: "",
      pesticideAck: false,
      photos: [],
    },
  },
  play: async ({ canvasElement }) => {
    mocked(createReviewAction).mockClear();
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const cropSearch = canvas.getByRole("combobox", { name: "作目" });
    await userEvent.type(cropSearch, "トマト");
    await userEvent.click(await page.findByRole("option", { name: "トマト なす科果菜類" }));
    await userEvent.type(cropSearch, "パプリカ");
    await userEvent.click(await page.findByRole("option", { name: "ピーマン なす科果菜類" }));
    await userEvent.click(canvas.getByRole("radio", { name: "4" }));
    await userEvent.type(canvas.getByLabelText("感想口コミ本文"), "根張りがよくなりました。");
    await userEvent.click(canvas.getByRole("checkbox", { name: /実際に使用した感想を/ }));
    await userEvent.click(canvas.getByRole("button", { name: "投稿する" }));

    await waitFor(() => expect(createReviewAction).toHaveBeenCalledTimes(1));
    const formData = mocked(createReviewAction).mock.calls[0]?.[2];
    if (!(formData instanceof FormData)) throw new TypeError("送信値が FormData ではありません。");
    await expect(formData.getAll("cropIds")).toEqual(["crop-pepper"]);
    await expect(formData.getAll("rating")).toEqual(["4"]);
  },
};
