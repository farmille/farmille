import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../../styled-system/css";

import { FieldError, FieldLabel } from "./FormUI";

const stackStyle = css({ display: "grid", gap: "4", maxW: "640px" });

function FormUiPreview() {
  return (
    <div className={stackStyle}>
      <div>
        <FieldLabel required htmlFor="storybook-field">
          使用後に観察した変化
        </FieldLabel>
        <input id="storybook-field" />
        <FieldError message="入力内容を確認してください。" />
      </div>
    </div>
  );
}

const meta = {
  title: "App/Materials/Report/FormUi",
  component: FieldLabel,
  args: { children: "使用後に観察した変化" },
  render: () => <FormUiPreview />,
} satisfies Meta<typeof FieldLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
