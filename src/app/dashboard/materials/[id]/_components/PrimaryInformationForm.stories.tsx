import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { materialDetail } from "@/app/materials/[id]/_components/story-fixtures";

import { PrimaryInformationForm } from "./PrimaryInformationForm";

const meta = {
  title: "App/Dashboard/Materials/PrimaryInformationForm",
  component: PrimaryInformationForm,
  args: { material: materialDetail },
} satisfies Meta<typeof PrimaryInformationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
