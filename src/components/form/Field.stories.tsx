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
    description: "本名でなくてOKです",
    children: <Input placeholder="例）農家の山田" />,
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
    children: <Input placeholder="例）090-1234-5678" type="tel" />,
  },
};

export const SmallLabel: Story = {
  args: {
    label: "郵便番号",
    labelSize: "sm",
    requirement: undefined,
    visibility: undefined,
    description: "郵便番号を入れると、都道府県と市区町村が自動で入ります。",
    children: <Input inputMode="numeric" placeholder="例）3100011" />,
  },
};

export const ClientError: Story = {
  args: {
    error: "ニックネームを入力してください。",
  },
};

/** サーバーの項目エラーは Form の errors で渡す。入力を変えると消える。 */
export const ServerError: Story = {
  render: (args) => (
    <Form errors={{ handle: "このハンドルネームはすでに使われています。" }}>
      <Field {...args}>
        <Input defaultValue="農家の山田" />
      </Field>
    </Form>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: <Input defaultValue="農家の山田" />,
  },
};

/** 見出しを隠しても、読み上げとラベル検索には残る。 */
export const HiddenLabel: Story = {
  args: {
    label: "姓",
    hideLabel: true,
    requirement: undefined,
    visibility: undefined,
    description: undefined,
    children: <Input placeholder="姓　例）山田" />,
  },
};
