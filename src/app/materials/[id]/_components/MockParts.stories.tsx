import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../styled-system/css";

import {
  MockAvatar,
  MockCheckIcon,
  MockChip,
  MockExternalIcon,
  MockNoImage,
  MockStars,
} from "./MockParts";
import { storyImageUrl } from "./story-fixtures";

const row = css({ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "3", mb: "4" });
const imageBox = css({ w: "24", h: "16" });

const meta = {
  title: "App/Materials/MockParts",
  component: MockStars,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { value: 4 },
} satisfies Meta<typeof MockStars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stars: Story = {
  render: () => (
    <div className={row}>
      <MockStars value={0} />
      <MockStars value={3.4} />
      <MockStars value={5} />
    </div>
  ),
};

export const Avatars: Story = {
  render: () => (
    <div className={row}>
      <MockAvatar name="株式会社グリーンバイオ" />
      <MockAvatar name="北のトマト農家" size={32} />
      <MockAvatar name="northfarm" size={30} />
      <MockAvatar name="北のトマト農家" extraSmall />
      <MockAvatar name="写真あり" src={storyImageUrl} />
      <MockAvatar name="写真あり" src={storyImageUrl} size={30} />
      <MockAvatar name="写真あり" src={storyImageUrl} extraSmall />
      <MockAvatar name="" />
    </div>
  ),
};

export const Chips: Story = {
  render: () => (
    <div className={row}>
      <MockChip>トマト</MockChip>
      <MockChip tone="grey">微生物資材</MockChip>
      <MockChip>光合成細菌・バチルス菌・トリコデルマ菌を配合した複合微生物資材</MockChip>
    </div>
  ),
};

export const NoImageAndIcons: Story = {
  render: () => (
    <div className={row}>
      <div className={imageBox}>
        <MockNoImage />
      </div>
      <MockCheckIcon />
      <MockExternalIcon />
    </div>
  ),
};
