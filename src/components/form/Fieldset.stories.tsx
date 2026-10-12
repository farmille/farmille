import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { Checkbox } from "./Checkbox";
import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { Input } from "./Input";

const nameRow = css({ display: "flex", gap: "2" });

const meta = {
  title: "Components/Form/Fieldset",
  component: Fieldset,
  args: {
    legend: "本名",
    requirement: "required",
    visibility: "private",
    children: (
      <div className={nameRow}>
        <Field hideLabel label="姓" name="familyName">
          <Input placeholder="姓" />
        </Field>
        <Field hideLabel label="名" name="givenName">
          <Input placeholder="名" />
        </Field>
      </div>
    ),
  },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NameParts: Story = {};

export const WithError: Story = {
  args: {
    error: "姓と名の両方を入力してください。",
  },
};

export const AddressParts: Story = {
  args: {
    legend: "住所",
    visibility: undefined,
    lead: "郵便番号、市区町村・番地、建物名は公開されません。",
    children: (
      <>
        <Field label="郵便番号" labelSize="sm" name="postalCode">
          <Input inputMode="numeric" placeholder="3100011" />
        </Field>
        <Field label="建物名・部屋番号" labelSize="sm" name="building" requirement="optional">
          <Input placeholder="〇〇マンション101" />
        </Field>
      </>
    ),
  },
};

export const HiddenLegend: Story = {
  args: {
    legend: "ご申請にあたっての確認事項",
    hideLegend: true,
    visibility: undefined,
    children: (
      <>
        <Field name="consent.0">
          <Checkbox>申請内容に誤りがないことを確認しました。</Checkbox>
        </Field>
        <Field name="consent.1">
          <Checkbox>審査の結果、掲載をお断りする場合があることに同意します。</Checkbox>
        </Field>
      </>
    ),
  },
};
