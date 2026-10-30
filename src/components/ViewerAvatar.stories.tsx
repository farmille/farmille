import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { ownProfile } from "@/app/me/_components/story-fixtures";
import type { SessionUser } from "@/server/auth";
import { getOwnProfile } from "@/server/queries/profiles";

import { ViewerAvatar } from "./ViewerAvatar";

const photo =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152"><rect width="152" height="152" fill="#C8E6C9"/><circle cx="76" cy="60" r="28" fill="#2E7D32"/></svg>',
  );

const general: SessionUser = {
  userId: ownProfile.userId,
  accountType: "general",
  sellerId: null,
  aal: "aal1",
};

// getOwnProfile は preview.tsx の sb.mock で __mocks__ 実装に差し替わっている。
const meta = {
  title: "Pages/Shared/ViewerAvatar",
  component: ViewerAvatar,
  parameters: { layout: "centered" },
  args: { session: general },
} satisfies Meta<typeof ViewerAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 画像を設定した人には、その画像を出す。 */
export const WithImage: Story = {
  beforeEach: () => {
    mocked(getOwnProfile).mockResolvedValue({
      ok: true,
      data: { ...ownProfile, avatarUrl: photo },
    });
  },
};

/** 画像を設定していない人には、表示名から決まる Humation のイラストを出す。 */
export const WithoutImage: Story = {
  beforeEach: () => {
    mocked(getOwnProfile).mockResolvedValue({ ok: true, data: ownProfile });
  },
};

/** メーカーは表示情報を持たないので、取得せず人型アイコンのまま。 */
export const Seller: Story = {
  args: { session: { ...general, accountType: "seller", sellerId: "s1" } },
};
