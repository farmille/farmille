import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArchiveMaterialForm, ConfirmMaterialInformationForm } from "./MaterialWorkflowForms";

const materialId = "00000000-0000-4000-8000-000000000101";

const meta = {
  title: "App/Dashboard/Materials/MaterialWorkflowForms",
  component: ConfirmMaterialInformationForm,
  args: { materialId },
} satisfies Meta<typeof ConfirmMaterialInformationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmInitialInformation: Story = {};

export const RequestArchive: Story = {
  render: () => <ArchiveMaterialForm materialId={materialId} />,
};
