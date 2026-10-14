import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "@/components/form";
import { css } from "../../../../styled-system/css";

import { EvidenceFields } from "./EvidenceFields";
const meta = {
  title: "Pages/company-requests/EvidenceFields",
  component: EvidenceFields,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    intentId: "11111111-1111-4111-8111-111111111111",
    itemKey: "22222222-2222-4222-8222-222222222222",
    purpose: "package",
    onBusy: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className={css({ p: "4" })}>
        <Field label="パッケージ資料" requirement="optional">
          {Story()}
        </Field>
      </div>
    ),
  ],
} satisfies Meta<typeof EvidenceFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
