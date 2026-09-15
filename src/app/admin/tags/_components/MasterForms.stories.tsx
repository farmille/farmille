import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../styled-system/css";

import { CropCreateForm, CropRow, TagCreateForm, TagRow } from "./MasterForms";

const stackStyle = css({ display: "grid", gap: "5" });

const meta = {
  title: "App/Admin/Tags/MasterForms",
  component: TagCreateForm,
  args: {
    categories: ["concern", "condition"],
  },
  render: (args) => (
    <div className={stackStyle}>
      <TagCreateForm {...args} />
      <TagRow
        tag={{
          id: "tag-concern",
          name: "高温障害",
          category: "concern",
          sort_order: 10,
          usageCount: 8,
        }}
      />
      <CropCreateForm groups={[{ id: "group-fruit", name: "果菜類" }]} />
      <CropRow
        crop={{
          id: "crop-tomato",
          name: "トマト",
          aliases: ["ミニトマト", "大玉トマト"],
          sort_order: 10,
          group_id: "group-fruit",
          groupName: "果菜類",
          usageCount: 24,
        }}
      />
    </div>
  ),
} satisfies Meta<typeof TagCreateForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
