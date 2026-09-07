import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EvidenceList } from "./EvidenceList";
import { materialEvidence } from "./story-fixtures";

const meta = {
  title: "App/Materials/EvidenceList",
  component: EvidenceList,
  args: { evidences: materialEvidence },
} satisfies Meta<typeof EvidenceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MissingReference: Story = {
  args: {
    evidences: [
      {
        ...materialEvidence[0],
        file_url: null,
        external_url: null,
      },
    ],
  },
};
