import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../Button";
import { TextLink } from "../TextLink";
import { FormActions } from "./FormActions";

const meta = {
  title: "Components/Form/FormActions",
  component: FormActions,
  args: {
    children: (
      <>
        <Button type="submit">保存する</Button>
        <Button variant="ghost">キャンセル</Button>
      </>
    ),
  },
} satisfies Meta<typeof FormActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Stack: Story = {};

export const Row: Story = {
  args: {
    layout: "row",
    children: (
      <>
        <Button size="sm" type="submit">
          承認する
        </Button>
        <Button size="sm" variant="danger">
          差し戻す
        </Button>
      </>
    ),
  },
};

export const Links: Story = {
  args: {
    layout: "links",
    children: (
      <>
        <TextLink href="/password-reset" variant="plain">
          パスワードを忘れた方
        </TextLink>
        <TextLink href="/signup" variant="plain">
          アカウントをお持ちでない方は新規登録
        </TextLink>
      </>
    ),
  },
};
