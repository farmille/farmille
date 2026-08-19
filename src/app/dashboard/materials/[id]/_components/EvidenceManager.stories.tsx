import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EvidenceManager } from "./EvidenceManager";

const meta = {
  title: "App/Dashboard/Materials/EvidenceManager",
  component: EvidenceManager,
  args: {
    sellerId: "00000000-0000-4000-8000-000000000201",
    materialId: "00000000-0000-4000-8000-000000000101",
    evidences: [
      {
        id: "00000000-0000-4000-8000-000000000701",
        evidence_type: "sds",
        title: "2026年版 安全データシート",
        file_url: null,
        external_url: "https://example.com/sds.pdf",
        sort_order: 10,
        created_at: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000702",
        evidence_type: "trial",
        title: "トマト栽培試験結果",
        file_url: "https://example.com/trial.webp",
        external_url: null,
        sort_order: 20,
        created_at: "2026-08-02T00:00:00.000Z",
      },
    ],
  },
  parameters: {
    nextjs: { navigation: { pathname: "/dashboard/materials/storybook" } },
  },
} satisfies Meta<typeof EvidenceManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEvidence: Story = {};

export const Empty: Story = {
  args: { evidences: [] },
};
