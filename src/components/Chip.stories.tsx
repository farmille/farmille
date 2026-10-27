import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { css } from "../../styled-system/css";
import { Chip } from "./Chip";

const meta = {
  title: "Components/Display/Chip",
  component: Chip,
  args: { children: "トマト" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
  args: { category: "作物" },
};

export const Removable: Story = {
  args: { category: "なす科果菜類", onRemove: fn(), removeLabel: "トマトを削除" },
};

export const Medium: Story = {
  args: {
    size: "md",
    category: "効果",
    children: "養分吸収の改善",
    onRemove: fn(),
    removeLabel: "養分吸収の改善を外す",
  },
};

export const Small: Story = {
  render: () => (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5" })}>
      <Chip size="xs">トマト</Chip>
      <Chip size="xs" tone="neutral">
        微生物
      </Chip>
    </div>
  ),
};

export const Truncated: Story = {
  render: () => (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5", w: "[200px]", p: "2" })}>
      <Chip category="作物" onRemove={fn()} removeLabel="西洋芝を外す">
        西洋芝（ケンタッキーブルーグラス）
      </Chip>
      <Chip size="xs" tone="neutral">
        アミノ酸、ペプチド、タンパク質加水分解物
      </Chip>
      <Chip size="xs">あぶらな科野菜（花蕾及び茎）として記載</Chip>
    </div>
  ),
};

export const ShortName: Story = {
  args: {
    size: "xs",
    tone: "neutral",
    children: "アミノ酸",
    fullLabel: "アミノ酸、ペプチド、タンパク質加水分解物",
  },
};
