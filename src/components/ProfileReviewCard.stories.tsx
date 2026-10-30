import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileReviewCard } from "./ProfileReviewCard";

const photo = (fill: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280"><rect width="280" height="280" fill="${fill}"/></svg>`,
  );

const meta = {
  title: "Pages/Shared/ProfileReviewCard",
  component: ProfileReviewCard,
  args: {
    review: {
      id: "review-1",
      materialId: "material-1",
      materialName: "土づくり微生物資材",
      cropName: "トマト",
      rating: 4,
      body: "定植前に使いました。根張りが安定し、潅水後の立ち上がりも良好でした。",
    },
    author: { name: "緑の畑", avatarUrl: null, label: "生産者 ・ 静岡県", href: null },
    actions: <span>参考になった 12</span>,
    reportReturnPath: "/materials/material-1",
  },
} satisfies Meta<typeof ProfileReviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LinkedAuthor: Story = {
  args: {
    author: {
      name: "北のきゅうり農家",
      avatarUrl: null,
      label: "",
      href: "/users/00000000-0000-4000-8000-000000000302",
    },
  },
};

export const WithdrawnAuthor: Story = {
  args: { author: { name: "退会済みユーザー", avatarUrl: null, label: "", href: null } },
};

export const WithPhotos: Story = {
  args: {
    review: {
      id: "review-2",
      materialId: "material-2",
      materialName: "根圏サポートA",
      cropName: "いちご",
      rating: 3.5,
      body: "1回目の散布から2週間後の様子です。\n葉色が濃くなり、ランナーの伸びも揃いました。\n\n次は濃度を変えて試します。",
      photos: [
        { id: "p1", url: photo("#C8E6C9"), alt: "散布2週間後の株" },
        { id: "p2", url: photo("#FFF4E0"), alt: "対照区の株" },
      ],
    },
  },
};

export const WithoutReport: Story = {
  args: { reportReturnPath: undefined, review: { ...meta.args.review, cropName: "", body: "" } },
};
