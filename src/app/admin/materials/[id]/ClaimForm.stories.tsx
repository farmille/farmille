import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClaimForm } from "./ClaimForm";

const sellers = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    official_name: "グリーンバイオ株式会社",
    login_id: "green-bio",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    official_name: "北の農業協同組合",
    login_id: "north-ja",
  },
];

const meta = {
  title: "Pages/admin/materials/[id]/ClaimForm",
  component: ClaimForm,
  args: {
    currentSellerId: sellers[0].id,
    materialId: "00000000-0000-4000-8000-000000000101",
    sellers,
  },
} satisfies Meta<typeof ClaimForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Claimed: Story = {};

export const Unclaimed: Story = {
  args: { currentSellerId: null },
};
