import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RelatedMaterialsView } from "./RelatedMaterialsSection";
import { relatedMaterials } from "./story-fixtures";

const meta = {
  title: "App/Materials/RelatedMaterialsSection",
  component: RelatedMaterialsView,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { related: relatedMaterials },
} satisfies Meta<typeof RelatedMaterialsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { related: [] },
};
