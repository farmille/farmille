import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field } from "./Field";
import { Form } from "./Form";
import { Input } from "./Input";

const meta = {
  title: "Components/Form/Field",
  component: Field,
  args: {
    label: "ニックネーム",
    name: "handle",
    requirement: "required",
    visibility: "public",
    description: "本名でなくて構いません。",
    children: <Input label={null} placeholder="農家の山田" />,
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Optional: Story = {
  args: {
    label: "電話番号",
    name: "phone",
    requirement: "optional",
    visibility: "private",
    lead: "確認が必要な場合の連絡に使用します。",
    description: undefined,
    children: <Input label={null} placeholder="090-1234-5678" type="tel" />,
  },
};

export const SmallLabel: Story = {
  args: {
    label: "郵便番号",
    labelSize: "sm",
    requirement: undefined,
    visibility: undefined,
    description: "郵便番号を入れると、都道府県と市区町村が自動で入ります。",
    children: <Input inputMode="numeric" label={null} placeholder="3100011" />,
  },
};

export const ClientError: Story = {
  args: {
    error: "ニックネームを入力してください。",
  },
};

export const ServerError: Story = {
  render: (args) => (
    <Form
      errors={{
        handle: "このニックネームはすでに使われています。別のニックネームを入力してください。",
      }}
      persist={false}
    >
      <Field {...args}>
        <Input defaultValue="農家の山田" label={null} />
      </Field>
    </Form>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: <Input defaultValue="農家の山田" label={null} />,
  },
};

export const HiddenLabel: Story = {
  args: {
    label: "姓",
    hideLabel: true,
    requirement: undefined,
    visibility: undefined,
    description: undefined,
    children: <Input label={null} placeholder="姓" />,
  },
};
