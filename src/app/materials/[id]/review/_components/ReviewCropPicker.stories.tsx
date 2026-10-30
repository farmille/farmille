import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { useReducer, type ComponentProps } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

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
  {
    id: "crop-strawberry",
    name: "いちご",
    aliases: ["苺"],
    groupName: "その他",
  },
];

const cropError = { cropIds: "作物を1つ以上選んでください。" };

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

function StatefulPicker(props: ComponentProps<typeof ReviewCropPicker>) {
  const [value, setValue] = useReducer(
    (_: readonly string[], next: readonly string[]) => next,
    props.value,
  );

  return (
    <ReviewCropPicker
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange(next);
      }}
    />
  );
}

const meta = {
  title: "Pages/materials/[id]/review/ReviewCropPicker",
  component: ReviewCropPicker,
  decorators: [fmDecorator],
  args: {
    crops,
    targetCropIds: ["crop-tomato", "crop-mini-tomato", "crop-cucumber"],
    value: ["crop-tomato"],
    onValueChange: fn(),
  },
  render: (args) => <StatefulPicker {...args} />,
} satisfies Meta<typeof ReviewCropPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

export const Selected: Story = {};

export const TargetCropSuggestions: Story = {
  args: { value: [] },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "使用対象作目" }));
    await waitFor(() =>
      expect(page(canvasElement).getByRole("option", { name: "きゅうり うり類" })).toBeVisible(),
    );
    await expect(page(canvasElement).queryByRole("option", { name: "いちご その他" })).toBeNull();
  },
};

export const NoTargetCrops: Story = {
  args: { value: [], targetCropIds: [] },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "使用対象作目" }));
    await waitFor(() =>
      expect(page(canvasElement).getByText("作物の名前を入力すると、候補が出ます。")).toBeVisible(),
    );
  },
};

export const WithError: Story = {
  args: { value: [] },
  render: (args) => (
    <Form errors={cropError} persist={false}>
      <StatefulPicker {...args} />
    </Form>
  ),
};

export const SearchingOtherCrop: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("combobox", { name: "使用対象作目" }),
      "苺",
    );
    await waitFor(() =>
      expect(page(canvasElement).getByRole("option", { name: "いちご その他" })).toBeVisible(),
    );
  },
};

export const Replaced: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox", { name: "使用対象作目" }), "ミニトマト");
    await userEvent.click(
      await page(canvasElement).findByRole("option", { name: "ミニトマト なす科果菜類" }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "ミニトマトを削除" })).toBeVisible(),
    );
    await expect(canvas.queryByRole("button", { name: "トマトを削除" })).toBeNull();
  },
};
