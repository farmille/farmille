import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { MediaFields } from "./MediaFields";

const meta = {
  title: "App/Materials/Report/MediaFields",
  component: MediaFields,
  args: {
    media: [
      {
        key: "media-storybook",
        url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80",
        file: null,
        mediaType: "photo",
        placement: "observation",
        caption: "定植3週間後の根張り",
      },
    ],
    onChange: fn(),
  },
} satisfies Meta<typeof MediaFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {};

export const Empty: Story = {
  args: { media: [] },
};

export const WithError: Story = {
  args: { media: [], error: "写真または動画を追加してください。" },
};
