import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewCard } from "./ReviewCard";

// 外部 URL を使わず、インライン SVG data URI をサンプル画像にする
const samplePhoto = (background: string, accent: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${background}"/><circle cx="300" cy="300" r="120" fill="${accent}"/></svg>`,
  );

const sampleAvatar =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#C8E6C9"/><circle cx="30" cy="24" r="10" fill="#2E7D32"/><ellipse cx="30" cy="52" rx="16" ry="12" fill="#2E7D32"/></svg>',
  );

const meta = {
  title: "Components/ReviewCard",
  component: ReviewCard,
  args: {
    handle: "トマト農家12年目",
    crop: "トマト（施設）",
    rating: 4.5,
    helpfulCount: 12,
    body: "定植前に土壌灌注で使用。うどんこ病の発生が例年より明らかに少なく、追肥との併用でも問題なかった。リピート予定。",
    reviewId: "review-1",
    materialId: "material-1",
  },
} satisfies Meta<typeof ReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 閲覧者視点（reviewId あり・canManage false）：押せる「参考になった」と通報ボタンが出る。 */
export const Viewer: Story = {};

/** 閲覧者が「参考になった」を押下済みの状態。 */
export const ViewerVoted: Story = {
  args: {
    helpfulVoted: true,
    helpfulCount: 13,
  },
};

/** 自分の投稿（canManage true）：編集・削除ボタンが出て、「参考になった」は押せない表示になる。 */
export const OwnReview: Story = {
  args: {
    canManage: true,
  },
};

/** 写真あり（photos に data URI）。横スクロールのサムネイル列が出る。 */
export const WithPhotos: Story = {
  args: {
    body: "収穫後の残渣処理と合わせて散布。写真の通り葉色が安定し、株の立ち上がりも早かった。",
    photos: [
      { id: "photo-1", src: samplePhoto("#E8F5E9", "#2E7D32"), alt: "定植前の圃場の様子" },
      { id: "photo-2", src: samplePhoto("#F1F8E9", "#558B2F"), alt: "散布から2週間後の葉の状態" },
      { id: "photo-3", src: samplePhoto("#E0F2F1", "#00695C"), alt: "収穫したトマトの比較" },
    ],
  },
};

/** 写真データ未取得で枚数だけ分かる場合：photoCount の数だけプレースホルダーが出る。 */
export const PhotoPlaceholders: Story = {
  args: {
    photoCount: 2,
  },
};

/** materialName あり（ホームの新着など、どの資材の感想口コミかを冒頭に示す）。 */
export const WithMaterialName: Story = {
  args: {
    materialName: "バチルス菌体資材 ツチイキル",
  },
};

/** アバター画像と投稿者ページへのリンクを持つ場合。 */
export const WithAvatarLink: Story = {
  args: {
    avatarSrc: sampleAvatar,
    authorHref: "/users/user-1",
  },
};

/** reviewId 無しの静的表示：「参考になった」は件数表示のみで、通報・編集は出ない。 */
export const Static: Story = {
  args: {
    reviewId: undefined,
    materialId: undefined,
  },
};

/** 長文感想口コミ。行間と折り返しの確認用。 */
export const LongBody: Story = {
  args: {
    handle: "露地野菜の佐藤",
    crop: "キュウリ",
    rating: 3.5,
    helpfulCount: 4,
    body: "昨シーズンからうどんこ病対策で導入している。育苗期の灌注と定植後の葉面散布を組み合わせたところ、発生初期の広がりが例年より緩やかになった印象。ただし梅雨明け以降の高温期は効果が落ちる感じがあり、化学農薬とのローテーションは結局必要だった。価格は安くないので、コスト面を考えると重点期間に絞って使うのが現実的だと思う。散布時の臭いはほとんど気にならず、収穫前日まで使える点はありがたい。",
  },
};
