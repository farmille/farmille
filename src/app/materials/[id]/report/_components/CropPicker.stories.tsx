import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { CropPicker } from "./CropPicker";

const crops = [
  { id: "crop-tomato", name: "トマト", aliases: ["ミニトマト"], groupName: "なす科果菜類" },
  { id: "crop-pepper", name: "ピーマン", aliases: ["パプリカ"], groupName: "なす科果菜類" },
  { id: "crop-orange", name: "温州みかん", aliases: ["みかん"], groupName: "かんきつ類" },
];

const meta = {
  title: "App/Materials/Report/CropPicker",
  component: CropPicker,
  args: {
    crops,
    selectedCropIds: ["crop-tomato", "crop-pepper"],
    activeCropId: "crop-tomato",
    onAdd: fn(),
    onRemove: fn(),
    onActivate: fn(),
  },
} satisfies Meta<typeof CropPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleCrops: Story = {};

export const Empty: Story = {
  args: { selectedCropIds: [], activeCropId: null },
};

export const WithError: Story = {
  args: { selectedCropIds: [], activeCropId: null, error: "作物を1つ以上選んでください。" },
};
