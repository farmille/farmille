import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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

export const SellerWorkspace: Story = {
  args: {
    chrome: "seller",
    variant: "back",
    title: "記事管理",
    backHref: "/dashboard",
  },
};
