import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { MaterialSearchForm } from "./MaterialSearchForm";

const meta = {
  title: "Pages/admin/materials/MaterialSearchForm",
  component: MaterialSearchForm,
} satisfies Meta<typeof MaterialSearchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithQuery: Story = {
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?q=スキーポン" hasMemory>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
};
