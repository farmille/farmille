import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

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
    body: "主な作目を登録すると、作目に合った資材やレポートを見つけやすくなります。",
    section: { current: 1, total: 3 },
    primaryLabel: "プロフィール画面へ",
    onSkipStep: fn(),
  },
};

export const Finish: Story = {
  args: {
    title: "チュートリアルは以上です",
    body: "使用したことのある資材があれば、感想口コミを記入してみてください。プロフィールの変更はマイページから、感想口コミの投稿は画面下の「＋」から、いつでもできます。",
    primaryLabel: "閉じる",
    onEnd: undefined,
  },
};
