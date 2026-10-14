import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SurfaceCard } from "@/components/SurfaceCard";

import { MaterialBox } from "./MaterialBox";

const meta = {
  title: "Pages/materials/[id]/MaterialBox",
  component: MaterialBox,
  args: {
    headingId: "storybook-box-heading",
    title: "製品説明",
    children: <SurfaceCard>土壌環境を整え、定植後の根張りを支える微生物資材です。</SurfaceCard>,
  },
} satisfies Meta<typeof MaterialBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
