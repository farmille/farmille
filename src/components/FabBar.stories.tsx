import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { getSessionUser } from "@/server/auth";
import { css } from "../../styled-system/css";
import { FabBar } from "./FabBar";

const meta = {
  title: "Pages/Shared/FabBar",
  component: FabBar,
  decorators: [
    (Story) => (
      <div className={css({ position: "relative", minH: "[160px]", maxW: "phone" })}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// getSessionUser は preview.ts の sb.mock で __mocks__ 実装に差し替わっており、
// コンポーネントと同じインスタンスを mocked() 経由で操作する。

// placement="container"（既定）：デコレーターの相対枠の下端に absolute 配置される。
export const Container: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    placement: "container",
  },
};

// placement="viewport"：プレビューのビューポート下端に fixed 配置される。
export const Viewport: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    placement: "viewport",
  },
};

// 資材詳細から使う場合の遷移先指定（/materials/[id]/report/new 等）。
export const MaterialDetailLinks: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: {
    placement: "container",
    reportHref: "/materials/101/report/new",
    reviewHref: "/materials/101/review/new",
  },
};

// 一般ユーザーログイン時も表示される（非ログインと同じ見た目）。
export const GeneralLoggedIn: Story = {
  name: "GeneralLoggedIn（一般ログイン・表示あり）",
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-1",
      accountType: "general",
      sellerId: null,
      aal: "aal1",
    });
  },
  args: {
    placement: "container",
  },
};

// メーカーログイン時はコンポーネントが null を返すため、何も描画されない（空のキャンバスが正）。
export const SellerReturnsNull: Story = {
  name: "SellerReturnsNull（メーカーログイン時は null を返し非表示）",
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-2",
      accountType: "seller",
      sellerId: "seller-1",
      aal: "aal1",
    });
  },
  args: {
    placement: "container",
  },
};

// 運営（admin）は一般ユーザー機能も使えるため、一般ログインと同じく表示される。
export const AdminLoggedIn: Story = {
  name: "AdminLoggedIn（運営ログイン・表示あり）",
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue({
      userId: "user-3",
      accountType: "admin",
      sellerId: null,
      aal: "aal2",
    });
  },
  args: {
    placement: "container",
  },
};

export const SiteLook: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: { look: "site", placement: "container" },
};

export const SiteLookViewport: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
  args: { look: "site", placement: "viewport" },
};
