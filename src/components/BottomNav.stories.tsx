import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { getSessionUser } from "@/server/auth";
import { css } from "../../styled-system/css";
import { BottomNav } from "./BottomNav";

const viewportStage = css({
  minH: "[150dvh]",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  bg: "surface.page",
});

const meta = {
  title: "Pages/Shared/BottomNav",
  component: BottomNav,
  args: {
    active: "home",
    placement: "container",
  },
} satisfies Meta<typeof BottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

// 非ログイン（中央の投稿ボタンあり）で active 各値を網羅する。
// getSessionUser は preview.ts の sb.mock で __mocks__ 実装に差し替わっており、
// コンポーネントと同じインスタンスを mocked() 経由で操作する。

export const ActiveHome: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    active: "home",
  },
};

export const ActiveSearch: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    active: "search",
  },
};

// active="post" は中央ボタンに対応し、4タブはどれもハイライトされない。
export const ActivePost: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    active: "post",
  },
};

export const ActiveArticles: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    active: "articles",
  },
};

export const ActiveMe: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    active: "me",
  },
};

// 実ページと同じ viewport 配置。縦長の Story でスクロール前後の固定位置を検証する。
export const ViewportFixed: Story = {
  name: "ViewportFixed（SP画面下固定）",
  decorators: [
    (Story) => (
      <div className={viewportStage}>
        <Story />
      </div>
    ),
  ],
  args: {
    active: "home",
    placement: "viewport",
  },
};

// 一般ユーザーログイン時も投稿ボタンは表示される（非ログインと同じ見た目）。
export const GeneralLoggedIn: Story = {
  name: "GeneralLoggedIn（一般ログイン・投稿ボタンあり）",
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-1",
      accountType: "general",
      sellerId: null,
      aal: "aal1",
    });
  },
  args: {
    active: "home",
  },
};

// メーカーログイン時は中央の投稿ボタンが非表示になり、4タブだけが並ぶ。
export const SellerLoggedIn: Story = {
  name: "SellerLoggedIn（メーカーログイン・投稿ボタン非表示）",
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-2",
      accountType: "seller",
      sellerId: "seller-1",
      aal: "aal1",
    });
  },
  args: {
    active: "home",
  },
};
