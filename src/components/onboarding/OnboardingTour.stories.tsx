import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OnboardingTour } from "./OnboardingTour";

/**
 * 案内は、登録後に案内を終えていない一般会員のセッションがあるときだけ出る。
 * Storybook にはセッションがないので何も描かない。各場面の見た目は TourSheet・TourTip・TourBar・TourSaved を見る。
 */
const meta = {
  title: "Pages/Shared/OnboardingTour",
  component: OnboardingTour,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof OnboardingTour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutMark: Story = {};
