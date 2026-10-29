import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { clearOnboarding, writeOnboardingStep } from "@/lib/onboarding";

import { OnboardingTour, OnboardingTourWith } from "./OnboardingTour";

const USER_ID = "00000000-0000-4000-8000-000000000701";
const REVIEW_FORM = "/materials/00000000-0000-4000-8000-000000000101/review/new";

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

/**
 * 投稿画面で出る最後のシート。印を消す通信が終わらない（遅い回線）間は、
 * 「閉じる」を読み込み中にして押せなくし、シートを残す。
 */
export const FinishOnSlowNetwork: Story = {
  parameters: { nextjs: { navigation: { pathname: REVIEW_FORM } } },
  beforeEach: () => {
    writeOnboardingStep(window.localStorage, USER_ID, "finish");
    return () => clearOnboarding(window.localStorage);
  },
  render: () => (
    <OnboardingTourWith
      findPendingUser={async () => USER_ID}
      finish={() => new Promise<boolean>(() => undefined)}
    />
  ),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(await screen.findByRole("button", { name: "閉じる" }));
    const close = screen.getByRole("button", { name: "閉じる" });
    await expect(close).toHaveAttribute("aria-busy", "true");
    await expect(close).toHaveAttribute("aria-disabled", "true");
    await expect(screen.getByText("チュートリアルはこれで完了です")).toBeInTheDocument();
    await expect(screen.queryByText("ありがとうございました")).toBeNull();
  },
};
