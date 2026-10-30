import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, userEvent, within } from "storybook/test";

import { ReviewSortSelect } from "./ReviewSortSelect";

const meta = {
  title: "Pages/materials/[id]/reviews/ReviewSortSelect",
  component: ReviewSortSelect,
} satisfies Meta<typeof ReviewSortSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Newest: Story = {};

export const SelectBeforeResponse: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const sort = canvas.getByRole("combobox", { name: "感想口コミの並び替え" });
    await userEvent.click(sort);
    await userEvent.click(await page.findByRole("option", { name: "参考になった順" }));
    await expect(sort).toHaveTextContent("参考になった順");
  },
};

export const Helpful: Story = {
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?sort=helpful" hasMemory>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
};
