import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
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
          <Input placeholder="姓　例）山田" />
        </Field>
        <Field hideLabel label="名" name="givenName">
          <Input placeholder="名　例）太郎" />
        </Field>
      </div>
    ),
  },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

/** name の無い組。中の Field がそれぞれ name とエラーを持つ。 */
export const NameParts: Story = {};

/** 組そのものへのエラー。error を渡すと組の下に出る。 */
export const WithError: Story = {
  args: {
    error: "姓と名の両方を入力してください。",
  },
};

/** 小さな見出しの項目を束ねる。requirement を省いた中の Field は組の必須に従う。 */
export const AddressParts: Story = {
  args: {
    legend: "住所",
    visibility: undefined,
    lead: "郵便番号・市区町村・番地・建物名は公開されません。",
    children: (
      <>
        <Field label="郵便番号" labelSize="sm" name="postalCode">
          <Input inputMode="numeric" placeholder="例）3100011" />
        </Field>
        <Field label="建物名・部屋番号" labelSize="sm" name="building" requirement="optional">
          <Input placeholder="例）〇〇マンション101" />
        </Field>
      </>
    ),
  },
};
