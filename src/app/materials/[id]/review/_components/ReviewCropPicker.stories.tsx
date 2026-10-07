import { useState } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { fn } from "storybook/test";

import { css, cx } from "../../../../../../styled-system/css";
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

const fmDecorator: Decorator = (Story) => (
  <div className={cx("fm", css({ p: "4" }))}>{Story()}</div>
);

const meta = {
  title: "App/Materials/Review/ReviewCropPicker",
  component: ReviewCropPicker,
  decorators: [fmDecorator],
  render: function ReviewCropStory(args) {
    const [ids, setIds] = useState(args.selectedCropIds);
    return (
      <ReviewCropPicker
        {...args}
        selectedCropIds={ids}
        onAdd={(id) => {
          args.onAdd(id);
          setIds([...ids, id]);
        }}
        onRemove={(id) => {
          args.onRemove(id);
          setIds(ids.filter((value) => value !== id));
        }}
      />
    );
  },
  args: {
    crops,
    selectedCropIds: ["crop-tomato", "crop-mini-tomato"],
    onAdd: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ReviewCropPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleCrops: Story = {};

export const EmptyWithProfileSuggestions: Story = {
  args: { selectedCropIds: [] },
};

export const WithError: Story = {
  args: {
    selectedCropIds: [],
    error: "作物を1つ以上選んでください。",
  },
};
