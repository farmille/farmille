import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";

import { formalPageRecipe } from "./formal-styles";

import { FormSection } from "./FormSection";

const meta = {
  title: "CompanyApplications/FormSection",
  component: FormSection,
  decorators: [
    (Story) => (
      <div className={css({ p: "4" })}>
        <div className={formalPageRecipe()}>{Story()}</div>
      </div>
    ),
  ],
  args: {
    title: "申請企業情報",
    children: <p>法人名・法人番号・担当者の連絡先を入力してください。</p>,
  },
} satisfies Meta<typeof FormSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
