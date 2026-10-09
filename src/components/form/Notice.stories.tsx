import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Notice } from "./Notice";

const meta = {
  title: "Components/Form/Notice",
  component: Notice,
  args: {
    tone: "error",
    children: "保存できませんでした。時間をおいてもう一度お試しください。",
  },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorTone: Story = {};

export const Success: Story = {
  args: { tone: "success", children: "プロフィールを保存しました。" },
};

export const Info: Story = {
  args: { tone: "info", children: "入力した内容は、運営の確認後に公開されます。" },
};

export const Warn: Story = {
  args: { tone: "warn", children: "以下すべてをご確認のうえ、チェックしてください。" },
};

export const Neutral: Story = {
  args: {
    tone: "neutral",
    children: "確認書類は審査にだけ使い、審査が終わると削除します。",
  },
};

/** 記入例のように、1行目を見出しにする。 */
export const WithTitle: Story = {
  args: {
    tone: "neutral",
    title: "記入例",
    children: "定植前に1000倍で土壌灌注。活着が早く、根の張りが良くなった。",
  },
};
