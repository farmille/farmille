import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";

import { Avatar } from "./Avatar";

const photo =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152"><rect width="152" height="152" fill="#C8E6C9"/><circle cx="76" cy="60" r="28" fill="#2E7D32"/></svg>',
  );

const row = css({ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "3" });

const meta = {
  title: "Components/Display/Avatar",
  component: Avatar,
  args: { name: "みどり農園" },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 画像が無いとき、表示名から決まるイラストを出す。同じ名前なら必ず同じ絵になる。 */
export const Illustration: Story = {};

export const WithImage: Story = { args: { src: photo } };

export const Sizes: Story = {
  render: (args) => (
    <div className={row}>
      {(["2xs", "xs", "sm", "md", "xl", "2xl"] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const SizesWithImage: Story = {
  args: { src: photo },
  render: Sizes.render,
};

/** 名前ごとに絵柄が変わる。 */
export const Names: Story = {
  render: (args) => (
    <div className={row}>
      {["株式会社グリーンバイオ", "北のトマト農家", "northfarm", "みどり農園", "さくら果樹園"].map(
        (name) => (
          <Avatar key={name} {...args} name={name} size="xl" />
        ),
      )}
    </div>
  ),
};
