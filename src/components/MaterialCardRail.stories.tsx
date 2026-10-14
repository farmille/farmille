import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialCard } from "./MaterialCard";
import { MaterialCardRail } from "./MaterialCardRail";

const meta = {
  title: "Pages/Shared/MaterialCardRail",
  component: MaterialCardRail,
  args: {
    children: null,
  },
} satisfies Meta<typeof MaterialCardRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <MaterialCardRail>
      {[
        ["アクティビオ検証", "デモ株式会社"],
        ["BIOZ Onyx Permanent", "ICL JAPAN"],
        ["BIOZ Sunstone", "ICL JAPAN"],
      ].map(([name, maker]) => (
        <MaterialCard
          key={name}
          variant="scroll"
          name={name}
          maker={maker}
          rating={4.2}
          reviewCount={12}
        />
      ))}
    </MaterialCardRail>
  ),
};
