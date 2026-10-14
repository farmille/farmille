import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SurfaceCard } from "./SurfaceCard";

const meta = {
  title: "Components/Layout/SurfaceCard",
  component: SurfaceCard,
  args: {
    title: "使用のポイント",
    description: "施用前によく振ってから、株元にかん注してください。",
    children: <p>定植の2週間前から使用すると、根の活着が安定しやすくなります。</p>,
  },
} satisfies Meta<typeof SurfaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    tone: "standard",
  },
};

export const Soft: Story = {
  args: {
    tone: "soft",
    title: "口コミサマリー",
    description: "直近30件の感想口コミから抽出した傾向です。",
    children: <p>「効果を実感」との回答が7割を超え、リピート意向も高い傾向です。</p>,
  },
};

export const TitleOnly: Story = {
  args: {
    description: undefined,
    children: (
      <ol>
        <li>資材を水で規定倍率に希釈する</li>
        <li>散布機で葉面全体に均一にかける</li>
        <li>散布後3日間は降雨を避ける</li>
      </ol>
    ),
  },
};

export const NoHeading: Story = {
  args: {
    title: undefined,
    description: undefined,
    children: <p>評価 4.2 ・ 感想口コミ128件</p>,
  },
};
