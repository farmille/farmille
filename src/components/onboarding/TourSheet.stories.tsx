import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, mocked } from "storybook/test";

import { FabBar } from "@/components/FabBar";
import { getSessionUser } from "@/server/auth";

import { TourSheet } from "./TourSheet";

const meta = {
  title: "Components/Onboarding/TourSheet",
  component: TourSheet,
  args: { onPrimary: fn(), onEnd: fn() },
} satisfies Meta<typeof TourSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  args: {
    title: "Farmilleへようこそ",
    welcome: true,
    body: "はじめての方向けに、Farmilleの基本的な使い方を3つの手順でご案内します。",
    primaryLabel: "はじめる",
  },
};

export const Section: Story = {
  args: {
    title: "プロフィールの設定",
    body: "栽培作目を登録すると、作目に合った資材や実証詳細レポートを見つけやすくなります。",
    section: { current: 1, total: 3 },
    primaryLabel: "プロフィール画面へ",
    onSkipStep: fn(),
  },
};

export const Finish: Story = {
  args: {
    title: "チュートリアルはこれで完了です",
    body: "使用したことのある資材があれば、感想口コミを投稿してください。投稿するときは、画面上部の「投稿する」（スマートフォンでは画面下の「＋」）を押します。",
    primaryLabel: "閉じる",
    onEnd: undefined,
  },
};

/** 「閉じる」を押した後、案内を終えた印を消し終えるまでの間。 */
export const FinishClosing: Story = {
  args: { ...Finish.args, primaryLoading: true },
};

// 資材ページの画面の下に固定された「実証詳細レポートを書く」「感想口コミを書く」のバーを隠さず、その上に出る。
// getSessionUser は preview.tsx の sb.mock で差し替わっており、FabBar と同じインスタンスを mocked() 経由で操作する。
export const AbovePostBar: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <FabBar placement="viewport" look="site" />
      </>
    ),
  ],
  args: {
    title: "感想口コミの投稿",
    body: "使用した資材の感想を、ほかの生産者と共有できます。",
    section: { current: 3, total: 3 },
    primaryLabel: "次へ",
    onSkipStep: fn(),
  },
};
