import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ErrorPage } from "./ErrorPage";

const sampleError = new Error("資材データの取得に失敗しました。");

const meta = {
  title: "App/ErrorPage",
  component: ErrorPage,
  args: {
    error: sampleError,
    onRetry: fn(),
    title: "読み込みに失敗しました",
    description: "通信環境をご確認のうえ、もう一度お試しください。",
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomPageTitle: Story = {
  args: {
    pageTitle: "資材詳細",
    backHref: "/materials/101",
    title: "資材情報を表示できません",
    description: "対象の資材が見つからないか、通信エラーが発生しました。",
  },
};

// Sentry へ送るための digest 付きエラー（本番のサーバーエラーを模したケース）。
export const WithDigest: Story = {
  args: {
    error: Object.assign(new Error("使用レポートの送信に失敗しました。"), {
      digest: "a1b2c3d4",
    }),
    pageTitle: "使用レポート",
    backHref: "/materials/101/report/new",
    title: "送信できませんでした",
    description: "しばらく時間をおいて再度お試しください。",
  },
};
