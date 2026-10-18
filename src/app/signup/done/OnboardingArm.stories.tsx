import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OnboardingArm } from "./OnboardingArm";

/** 画面には何も出さない。登録完了画面を開いたブラウザに、初回ログインの案内を出す印を残す。 */
const meta = {
  title: "Pages/signup/done/OnboardingArm",
  component: OnboardingArm,
} satisfies Meta<typeof OnboardingArm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
