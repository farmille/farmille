import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportFacts } from "./ReportFacts";

const meta = {
  title: "Components/Display/ReportFacts",
  component: ReportFacts,
  args: {
    crop: "ミニトマト（アイコ）",
    effects: ["耐暑性改善", "しおれ軽減"],
    standpoint: "生産者",
  },
} satisfies Meta<typeof ReportFacts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongValues: Story = {
  args: {
    crop: "ミニトマト（アイコ、千果、CF千果、シンディースイート）",
    effects: ["耐暑性改善", "しおれ軽減", "根張り改善", "食味向上"],
  },
};

export const WithoutStandpoint: Story = {
  args: { standpoint: undefined },
};
