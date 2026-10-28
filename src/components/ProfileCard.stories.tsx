import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileCard } from "./ProfileCard";

const avatar =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152"><rect width="152" height="152" fill="#C8E6C9"/><circle cx="76" cy="60" r="28" fill="#2E7D32"/></svg>',
  );

const emptyDetails = {
  standpoint: "farmer",
  prefecture_code: null,
  bio: "",
  affiliations: [],
  crops: [],
  cropNamesOther: [],
  links: [],
};

const fullDetails = {
  standpoint: "farmer",
  prefecture_code: 22,
  bio: "静岡で施設トマトといちごを育てています。土づくりと微生物資材の使い方を記録しています。",
  affiliations: ["JA青年部", "浜松トマト研究会"],
  crops: [
    { id: "10000000-0000-4000-8000-000000000001", name: "トマト", aliases: [] },
    { id: "10000000-0000-4000-8000-000000000002", name: "いちご", aliases: ["苺"] },
  ],
  cropNamesOther: [],
  links: ["https://www.ichigo-farm.com/about", "https://example.com/blog"],
};

const meta = {
  title: "Pages/Shared/ProfileCard",
  component: ProfileCard,
  args: {
    handle: "緑の畑",
    avatarUrl: null,
    details: fullDetails,
    stats: [
      { label: "実証詳細レポート", value: 3 },
      { label: "感想口コミ", value: 12 },
      { label: "参考になった", value: 48 },
    ],
  },
} satisfies Meta<typeof ProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Public: Story = {};

export const PublicWithAvatar: Story = { args: { avatarUrl: avatar } };

export const OwnFilled: Story = {
  args: {
    editable: true,
    avatarUrl: avatar,
  },
};

export const OwnEmpty: Story = {
  args: {
    editable: true,
    details: { ...emptyDetails, prefecture_code: 8 },
    stats: [
      { label: "実証詳細レポート", value: 0 },
      { label: "感想口コミ", value: 0 },
      { label: "お気に入り", value: 0 },
    ],
  },
};

export const Minimal: Story = { args: { details: emptyDetails } };

export const OtherStandpoint: Story = {
  args: { editable: true, details: { ...fullDetails, standpoint: "other" } },
};

export const JaStandpoint: Story = {
  args: { editable: true, details: { ...fullDetails, standpoint: "ja" } },
};

export const LongHandle: Story = {
  args: { editable: true, handle: "はままつ施設トマトといちごの山田農園" },
};
