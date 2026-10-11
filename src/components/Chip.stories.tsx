import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { css } from "../../styled-system/css";
import { Chip } from "./Chip";

const meta = {
  title: "Components/Chip",
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

export const Wrapping: Story = {
  render: () => (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
      <Chip category="作物" onRemove={fn()} removeLabel="たまねぎを外す" size="md">
        たまねぎ
      </Chip>
      <Chip category="効果" onRemove={fn()} removeLabel="養分吸収の改善を外す" size="md">
        養分吸収の改善
      </Chip>
      <Chip category="メーカー" onRemove={fn()} removeLabel="みどり化成工業を外す" size="md">
        みどり化成工業
      </Chip>
      <Chip>微生物資材「グリーンバイオ・スーパーアクティブ土壌改良剤」</Chip>
    </div>
  ),
};
