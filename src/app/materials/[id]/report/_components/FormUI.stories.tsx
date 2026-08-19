import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { css } from "../../../../../../styled-system/css";

import { Choice, ConsentCheck, FieldError, FieldLabel, TogglePanel } from "./FormUI";

const stackStyle = css({ display: "grid", gap: "4", maxW: "640px" });

function FormUiPreview() {
  const [selected, setSelected] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [consented, setConsented] = useState(false);

  return (
    <div className={stackStyle}>
      <div>
        <FieldLabel required htmlFor="storybook-field">
          使用後に観察した変化
        </FieldLabel>
        <input id="storybook-field" />
        <FieldError message="入力内容を確認してください。" />
      </div>
      <Choice selected={selected} onClick={() => setSelected((current) => !current)}>
        根・土壌・培地に施用
      </Choice>
      <TogglePanel checked={expanded} label="比較条件を入力" onChange={setExpanded}>
        対照区の条件
      </TogglePanel>
      <ConsentCheck
        checked={consented}
        onChange={setConsented}
        error={consented ? undefined : "内容を確認し、同意してください。"}
      />
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
