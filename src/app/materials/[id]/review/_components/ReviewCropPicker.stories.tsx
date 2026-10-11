import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Form } from "@/components/form";
import { css } from "../../../../../../styled-system/css";
import { ReviewCropPicker } from "./ReviewCropPicker";

const crops = [
  {
    id: "crop-tomato",
    name: "トマト",
    aliases: ["大玉トマト"],
    groupName: "なす科果菜類",
  },
  {
    id: "crop-mini-tomato",
    name: "ミニトマト",
    aliases: ["プチトマト"],
    groupName: "なす科果菜類",
  },
  {
    id: "crop-cucumber",
    name: "きゅうり",
    aliases: [],
    groupName: "うり類",
  },
];

const cropError = { cropIds: "作物を1つ以上選んでください。" };

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "App/Materials/Review/ReviewCropPicker",
  component: ReviewCropPicker,
  decorators: [fmDecorator],
  args: {
    crops,
    defaultCropIds: ["crop-tomato", "crop-mini-tomato"],
  },
} satisfies Meta<typeof ReviewCropPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

export const MultipleCrops: Story = {};

export const EmptyWithProfileSuggestions: Story = {
  args: { defaultCropIds: [] },
};

export const WithError: Story = {
  args: { defaultCropIds: [] },
  render: (args) => (
    <Form errors={cropError}>
      <ReviewCropPicker {...args} />
    </Form>
  ),
};

export const Searching: Story = {
  args: { defaultCropIds: ["crop-tomato"] },
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox", { name: "作目" }), "プチ");
    await waitFor(() =>
      expect(
        page(canvasElement).getByRole("option", { name: "ミニトマト なす科果菜類" }),
      ).toBeVisible(),
    );
  },
};

export const Replaced: Story = {
  args: { defaultCropIds: ["crop-tomato"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox", { name: "作目" }), "ミニトマト");
    await userEvent.click(
      await page(canvasElement).findByRole("option", { name: "ミニトマト なす科果菜類" }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "ミニトマトを削除" })).toBeVisible(),
    );
    await expect(canvas.queryByRole("button", { name: "トマトを削除" })).toBeNull();
  },
};
