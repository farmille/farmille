import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Form } from "./Form";
import { RadioGroup } from "./RadioGroup";

const targets = [
  {
    value: "new",
    label: "資材の新規掲載",
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
    label: "申請内容",
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
  args: { label: "栽培形態", name: "cultivation", options: cultivation, variant: "cards" },
};

export const CardsChecked: Story = {
  args: {
    label: "栽培形態",
    name: "cultivation",
    options: cultivation,
    defaultValue: "house",
    variant: "cards",
  },
};

export const InFieldset: Story = {
  args: { defaultValue: "new", requirement: "required" },
};

export const CardsInFieldset: Story = {
  args: {
    description: "投稿やマイページで肩書きとして表示されます。",
    label: "あなたの立場",
    name: "standpoint",
    requirement: "required",
    visibility: "public",
    defaultValue: "farmer",
    options: standpoints,
    variant: "cards",
  },
};

export const GroupError: Story = {
  args: {
    label: "あなたの立場",
    name: "standpoint",
    requirement: "required",
    visibility: "public",
    options: standpoints,
    variant: "cards",
  },
  render: (args) => (
    <Form errors={{ standpoint: "立場を選んでください。" }} persist={false}>
      <RadioGroup {...args} />
    </Form>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "existing" },
};
