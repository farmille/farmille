import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { userEvent, within } from "storybook/test";

import type { PostingMaterialWithImage } from "@/server/queries/materials";
import { css } from "../../../styled-system/css";
import { MaterialPicker } from "./MaterialPicker";

const materials = [
  {
    id: "material-1",
    name: "土づくり微生物資材",
    manufacturer_name: "グリーンバイオ株式会社",
    review_count: 18,
    avg_rating: 4.3,
    manufacturer_verified_at: "2026-08-01T00:00:00.000Z",
    imageUrl: null,
  },
  {
    id: "material-2",
    name: "根圏サポートA",
    manufacturer_name: "ファーム技研",
    review_count: 9,
    avg_rating: 3.8,
    manufacturer_verified_at: null,
    imageUrl: null,
  },
] satisfies PostingMaterialWithImage[];

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "App/Post/MaterialPicker",
  component: MaterialPicker,
  decorators: [fmDecorator],
  args: { materials, query: "" },
} satisfies Meta<typeof MaterialPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Results: Story = {};

export const Selected: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "土づくり微生物資材を選択" }),
    );
  },
};

export const NoResults: Story = {
  args: { materials: [], query: "見つからない資材" },
};
