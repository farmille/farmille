import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { ownProfile } from "@/app/me/_components/story-fixtures";
import { getSessionUser } from "@/server/auth";
import { getOwnProfile } from "@/server/queries/profiles";

import { SiteAppBar } from "./SiteAppBar";

const photo =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152"><rect width="152" height="152" fill="#C8E6C9"/><circle cx="76" cy="60" r="28" fill="#2E7D32"/></svg>',
  );

// getSessionUser と getOwnProfile は preview.ts の sb.mock で __mocks__ 実装に差し替わっている。
// PCヘッダーは tab（768px）以上でしか表示しないため、デスクトップ幅で確認する。
const meta = {
  title: "Pages/Shared/SiteAppBar",
  component: SiteAppBar,
  args: { chrome: "public", variant: "home" },
  globals: { viewport: { value: "desktop1440", isRotated: false } },
} satisfies Meta<typeof SiteAppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 画像を設定した人は、アカウントボタンがその画像になる。 */
export const SignedInWithImage: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: ownProfile.userId,
      accountType: "general",
      sellerId: null,
      aal: "aal1",
    });
    mocked(getOwnProfile).mockResolvedValue({
      ok: true,
      data: { ...ownProfile, avatarUrl: photo },
    });
  },
};

/** 画像を設定していない人は、表示名から決まる Humation のイラストになる。 */
export const SignedInWithoutImage: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: ownProfile.userId,
      accountType: "general",
      sellerId: null,
      aal: "aal1",
    });
    mocked(getOwnProfile).mockResolvedValue({ ok: true, data: ownProfile });
  },
};

export const SignedOut: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
};
