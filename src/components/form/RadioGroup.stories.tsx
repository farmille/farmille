import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Fieldset } from "./Fieldset";
import { Form } from "./Form";
import { RadioGroup } from "./RadioGroup";

const targets = [
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
];

const cultivation = [
  { value: "house", label: "施設栽培（ハウス・温室）" },
  { value: "field", label: "露地栽培" },
  { value: "both", label: "両方" },
];

const standpoints = [
  { value: "farmer", label: "生産者" },
  { value: "ja", label: "JAグループ職員（営農指導員など）" },
  { value: "public", label: "行政関係者（都道府県の普及員や研究員）" },
  { value: "other", label: "その他（メーカー関係者、専門家、大学研究員など）" },
];

const meta = {
  title: "Components/Form/RadioGroup",
  component: RadioGroup,
  args: {
    "aria-label": "申請内容",
    name: "target",
    options: targets,
    onValueChange: fn(),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};

export const ListChecked: Story = {
  args: { defaultValue: "new" },
};

export const Cards: Story = {
  args: { "aria-label": "栽培形態", name: "cultivation", options: cultivation, variant: "cards" },
};

export const CardsChecked: Story = {
  args: {
    "aria-label": "栽培形態",
    name: "cultivation",
    options: cultivation,
    defaultValue: "house",
    variant: "cards",
  },
};

export const InFieldset: Story = {
  render: (args) => (
    <Fieldset legend="申請内容" name="target" requirement="required">
      <RadioGroup {...args} aria-label={undefined} defaultValue="new" />
    </Fieldset>
  ),
};

export const CardsInFieldset: Story = {
  render: (args) => (
    <Fieldset
      description="立場は、投稿やマイページで肩書きとして表示されます。"
      legend="あなたの立場"
      name="standpoint"
      requirement="required"
      visibility="public"
    >
      <RadioGroup
        {...args}
        aria-label={undefined}
        defaultValue="farmer"
        options={standpoints}
        variant="cards"
      />
    </Fieldset>
  ),
};

export const GroupError: Story = {
  render: (args) => (
    <Form errors={{ standpoint: "立場を選んでください。" }}>
      <Fieldset legend="あなたの立場" name="standpoint" requirement="required" visibility="public">
        <RadioGroup {...args} aria-label={undefined} options={standpoints} variant="cards" />
      </Fieldset>
    </Form>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "existing" },
};
