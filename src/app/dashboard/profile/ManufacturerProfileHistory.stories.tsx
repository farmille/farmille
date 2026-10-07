import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ManufacturerProfileHistory } from "./ManufacturerProfileHistory";

const meta = {
  title: "Manufacturer/ProfileHistory",
  component: ManufacturerProfileHistory,
  args: {
    versions: [
      {
        id: "44444444-4444-4444-8444-444444444441",
        status: "returned",
        created_at: "2026-09-30T03:00:00Z",
        review_note: "「必ず効く」は効果を断定する表現のため、言い換えてください。",
      },
      {
        id: "44444444-4444-4444-8444-444444444442",
        status: "published",
        created_at: "2026-09-12T03:00:00Z",
        review_note: null,
      },
      {
        id: "44444444-4444-4444-8444-444444444443",
        status: "superseded",
        created_at: "2026-08-01T03:00:00Z",
        review_note: null,
      },
    ],
  },
} satisfies Meta<typeof ManufacturerProfileHistory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { versions: [] } };
