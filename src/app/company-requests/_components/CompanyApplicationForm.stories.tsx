import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { formalPageRecipe } from "./formal-styles";
import { CompanyApplicationForm } from "./CompanyApplicationForm";
import { emptyContact } from "./ContactFields";
const meta = {
  title: "CompanyApplications/CompanyApplicationForm",
  component: CompanyApplicationForm,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    intentId: "11111111-1111-4111-8111-111111111111",
    kind: "registration",
    defaults: emptyContact,
    recipient: "contact@example.com",
  },
  decorators: [
    (Story) => (
      <div className={css({ p: "4" })}>
        <div className={formalPageRecipe()}>{Story()}</div>
      </div>
    ),
  ],
} satisfies Meta<typeof CompanyApplicationForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Removal: Story = { args: { kind: "removal" } };
