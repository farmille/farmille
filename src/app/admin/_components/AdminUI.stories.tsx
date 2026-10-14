import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DescriptionList, OptionalValue, Panel } from "./AdminUI";

const meta = {
  title: "Pages/admin/AdminUI",
  component: Panel,
  args: {
    title: "申請内容",
    note: "2026年8月9日受付",
    children: null,
  },
  render: (args) => (
    <Panel {...args}>
      <DescriptionList
        items={[
          { term: "法人名", value: "グリーンバイオ株式会社" },
          { term: "所在地", value: "北海道札幌市" },
          { term: "公式サイト", value: <OptionalValue value="" /> },
        ]}
      />
    </Panel>
  ),
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
