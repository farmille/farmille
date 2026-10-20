import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { TourBar } from "./TourBar";

const meta = {
  title: "Components/Onboarding/TourBar",
  component: TourBar,
  args: { onSkipStep: fn(), onEnd: fn() },
} satisfies Meta<typeof TourBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MessageOnly: Story = {
  args: {
    message: "画面を下へスクロールして、製品情報や実証詳細レポート、感想口コミを確認してください。",
  },
};

export const WithScrollHint: Story = {
  args: {
    section: 2,
    title: "画面の下に、実証詳細レポートと感想口コミがあります。",
    message: "下へスクロールして、製品情報と合わせて確認してください。",
    scrollHint: { label: "下へスクロール", onClick: fn() },
  },
};

export const WithSave: Story = {
  args: {
    section: 1,
    message:
      "主な作目を選んで「保存する」を押してください（複数選択可）。所属や自己紹介も入力できます。",
    action: { label: "保存する", onClick: fn() },
  },
};
