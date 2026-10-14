import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "../../articles/_components/story-frame";

import { ReportFigures } from "./ReportFigures";

const photo = (n: number, caption: string | null) => ({
  id: `p${n}`,
  url: "/missing-material-image.png",
  mediaType: "photo" as const,
  caption,
});

const meta = {
  title: "Pages/reports/[id]/ReportFigures",
  component: ReportFigures,
  decorators: [(Story) => readingFrame(Story())],
  args: { media: [photo(1, "使用区の株（7月20日）")] },
} satisfies Meta<typeof ReportFigures>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Single: Story = {};
export const Pair: Story = { args: { media: [photo(1, "対照区"), photo(2, "使用区")] } };
export const GridOfThree: Story = {
  args: { media: [photo(1, "対照区"), photo(2, null), photo(3, "使用区の葉の様子")], grid: true },
};
