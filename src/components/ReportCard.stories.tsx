import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportCard } from "./ReportCard";

// 外部 URL を使わず、インライン SVG data URI をサンプル画像にする
const sampleCover =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#E8F5E9"/><rect x="0" y="320" width="640" height="160" fill="#A5D6A7"/><circle cx="500" cy="120" r="70" fill="#FFF59D"/><path d="M80 320 L160 200 L240 320 Z" fill="#2E7D32"/><path d="M200 320 L300 170 L400 320 Z" fill="#388E3C"/></svg>',
  );

const sampleAvatar =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#C8E6C9"/><circle cx="30" cy="24" r="10" fill="#2E7D32"/><ellipse cx="30" cy="52" rx="16" ry="12" fill="#2E7D32"/></svg>',
  );

const meta = {
  title: "Pages/Shared/ReportCard",
  component: ReportCard,
  args: {
    title: "ツチイキルをトマト施設栽培で3か月使ってみた",
    author: "露地野菜の佐藤",
    crop: "トマト（施設）",
    helpfulCount: 34,
  },
} satisfies Meta<typeof ReportCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一覧フル幅（既定 layout）。カバー未設定時はプレースホルダーアイコンが出る。 */
export const List: Story = {
  args: {
    viewCount: 210,
  },
};

/** 一覧＋カバー画像あり。 */
export const ListWithCover: Story = {
  args: {
    coverSrc: sampleCover,
    viewCount: 210,
  },
};

/** アバター画像と投稿者ページへのリンクを持つ場合。 */
export const ListWithAvatarLink: Story = {
  args: {
    avatarSrc: sampleAvatar,
    authorHref: "/users/user-2",
    viewCount: 210,
  },
};

/** 閲覧数なし（viewCount 未指定）。 */
export const ListNoViewCount: Story = {};

/** 2列グリッド用のコンパクト表示：作物チップと「参考になった」ラベルが省略される。 */
export const Grid: Story = {
  args: {
    layout: "grid",
    viewCount: 98,
  },
};

/** グリッド＋カバー画像あり。 */
export const GridWithCover: Story = {
  args: {
    layout: "grid",
    coverSrc: sampleCover,
    viewCount: 98,
  },
};

/** ホーム横スクロール用。scroll-snap 前提の幅指定を持つ。 */
export const Scroll: Story = {
  args: {
    layout: "scroll",
    coverSrc: sampleCover,
  },
};

/** 長文タイトル。折り返しの確認用。 */
export const LongTitle: Story = {
  args: {
    title:
      "連作障害に悩んだハウスキュウリでトリコデルマ菌床 ネマガードを1作通して使った記録（土壌診断の数値つき）",
    author: "トマト農家12年目",
    crop: "キュウリ",
    helpfulCount: 121,
    viewCount: 305,
    coverSrc: sampleCover,
  },
};
