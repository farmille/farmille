import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialDescriptionBox, MaterialTimingBox } from "./MaterialOverview";

const meta = {
  title: "Pages/materials/[id]/MaterialOverview",
  component: MaterialDescriptionBox,
  args: {
    description:
      "土壌環境を整え、定植後の根張りを支える微生物資材です。\nバチルス属菌が根圏に定着し、養分の吸収を助けます。",
  },
} satisfies Meta<typeof MaterialDescriptionBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Description: Story = {};

export const DescriptionEmpty: Story = {
  args: { description: undefined },
};

export const Timing: Story = {
  render: () => <MaterialTimingBox timings={[0, 1, 3]} />,
};

export const TimingEmpty: Story = {
  render: () => <MaterialTimingBox timings={[]} />,
};
