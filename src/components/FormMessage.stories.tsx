import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormMessage } from "./FormMessage";

const meta = {
  title: "Components/FormMessage",
  component: FormMessage,
  args: {
    status: "success",
    children: "感想口コミを投稿しました。",
  },
} satisfies Meta<typeof FormMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const SuccessLong: Story = {
  args: {
    children: "お気に入りに追加しました。マイページのお気に入りからいつでも確認できます。",
  },
};

export const Error: Story = {
  args: {
    status: "error",
    children: "資材名は必須です。入力してください。",
  },
};

export const ErrorLong: Story = {
  args: {
    status: "error",
    children:
      "評価・感想口コミ本文・使用時期のいずれかが未入力です。すべての必須項目を入力してから送信してください。",
  },
};
