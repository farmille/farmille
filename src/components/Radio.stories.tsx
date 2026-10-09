import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Radio, RadioGroup } from "./Radio";
import { Field } from "./auth/Fields";
import { css } from "../../styled-system/css";

const meta = { title: "Components/Radio", component: Radio } satisfies Meta<typeof Radio>;
export default meta;
type Story = StoryObj<typeof meta>;

const rowStyle = css({ display: "inline-flex", alignItems: "center", gap: "2.5", fontSize: "md" });

export const Default: Story = {
  render: () => (
    <label className={rowStyle}>
      <Radio name="default" />
      資材情報の新規掲載
    </label>
  ),
};
export const Checked: Story = {
  render: () => (
    <label className={rowStyle}>
      <Radio defaultChecked name="checked" />
      資材情報の新規掲載
    </label>
  ),
};
export const Disabled: Story = {
  render: () => (
    <label className={rowStyle}>
      <Radio disabled name="disabled" />
      資材情報の新規掲載
    </label>
  ),
};

export const GroupWithDescriptions: Story = {
  render: () => (
    <Field label="申請内容" labelId="radio-group-label" requirement="required">
      <RadioGroup
        aria-labelledby="radio-group-label"
        defaultValue="new"
        name="target"
        options={[
          {
            value: "new",
            label: "資材情報の新規掲載",
            description: "Farmille にまだ載っていない資材を新しく掲載します。",
          },
          {
            value: "existing",
            label: "掲載済み資材の資材オーナー権限",
            description: "すでに掲載されている資材の情報を、メーカーとして管理します。",
          },
        ]}
        required
      />
    </Field>
  ),
};
