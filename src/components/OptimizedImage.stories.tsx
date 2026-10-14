import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OptimizedImage } from "./OptimizedImage";

const materialPhoto =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#E8F5E9"/><circle cx="160" cy="120" r="70" fill="#2E7D32"/><text x="160" y="128" font-size="20" fill="#ffffff" text-anchor="middle" font-family="sans-serif">ツチイキル</text></svg>',
  );

const meta = {
  title: "Components/Display/OptimizedImage",
  component: OptimizedImage,
  args: {
    src: materialPhoto,
    alt: "バチルス菌体資材 ツチイキルのパッケージ写真",
    width: 320,
    height: 240,
  },
} satisfies Meta<typeof OptimizedImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPreload: Story = {
  args: {
    preload: true,
  },
};

export const WithoutPreload: Story = {
  args: {
    preload: false,
  },
};
