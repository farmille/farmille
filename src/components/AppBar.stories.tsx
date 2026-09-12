import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { AppBar } from "./AppBar";

const meta = {
  title: "Components/AppBar",
  component: AppBar,
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  args: {
    chrome: "public",
    variant: "home",
  },
};

// PCヘッダーは tab（768px）以上でしか表示しないため、検索入力欄の確認はこの Story だけで行う。
export const HomeSearchTyped: Story = {
  args: {
    chrome: "public",
    variant: "home",
  },
  globals: {
    viewport: { value: "desktop1440", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("searchbox", { name: "資材を検索" }),
      "トマト",
    );
  },
};

export const HomeWithSearchHref: Story = {
  args: {
    chrome: "public",
    variant: "home",
    searchHref: "/search?category=microbial",
  },
};

export const Back: Story = {
  args: {
    chrome: "public",
    variant: "back",
    title: "資材詳細",
  },
};

export const BackWithShare: Story = {
  args: {
    chrome: "public",
    variant: "back",
    title: "バチルス菌体資材 ツチイキル",
    backHref: "/search",
    shareHref: "/materials/101",
  },
};

// 長い資材名は ellipsis で省略される。
export const BackLongTitle: Story = {
  args: {
    chrome: "public",
    variant: "back",
    title: "トリコデルマ菌床 ネマガード 液体タイプ 20L 業務用（大地の恵み農材）",
    shareHref: "/materials/102",
  },
};

// title 未指定時は空欄のまま（戻るボタンだけの AppBar）。
export const BackNoTitle: Story = {
  args: {
    chrome: "public",
    variant: "back",
  },
};

// `/search` に `q` 付きで着地した状態。ヘッダーの入力欄に現在の `q` が入る。
export const SearchPageWithQuery: Story = {
  args: {
    chrome: "public",
    variant: "back",
    active: "search",
    title: "BS資材を探す",
    backHref: "/",
    searchQuery: "トマト",
  },
  globals: {
    viewport: { value: "desktop1440", isRotated: false },
  },
};

export const SellerWorkspace: Story = {
  args: {
    chrome: "seller",
    variant: "back",
    title: "記事管理",
    backHref: "/dashboard",
  },
};
