import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportLegacyMedia } from "./ReportLegacyMedia";

const photo = "/missing-material-image.png";

const meta = {
  title: "Pages/materials/[id]/report/ReportLegacyMedia",
  component: ReportLegacyMedia,
  args: {
    media: [
      {
        id: "00000000-0000-4000-8000-000000000301",
        url: photo,
        mediaType: "photo",
        section: "results",
        caption: "使用区の株（7月20日）",
      },
      {
        id: "00000000-0000-4000-8000-000000000302",
        url: photo,
        mediaType: "photo",
        section: "plots",
        caption: "",
      },
    ],
    onRemove: fn(),
  },
} satisfies Meta<typeof ReportLegacyMedia>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
