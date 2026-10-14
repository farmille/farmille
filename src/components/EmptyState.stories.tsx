import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Components/Feedback/EmptyState",
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    title: "感想口コミがまだありません",
    description: "気になる資材を使ったら、最初の感想口コミを投稿してみましょう。",
  },
};

export const WithAction: Story = {
  args: {
    title: "お気に入りに資材がありません",
    description: "資材ページの「お気に入りに保存」から気になる資材を追加できます。",
    children: <Button onClick={fn()}>資材を探す</Button>,
  },
};

export const SearchNoResults: Story = {
  args: {
    title: "該当する資材が見つかりませんでした",
    description: "キーワードや絞り込み条件を変えて再検索してください。",
  },
};
