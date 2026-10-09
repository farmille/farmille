import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";
import { SearchResultCard } from "./SearchResultCard";
import { storyThumbnail } from "./story-fixtures";

const meta = {
  title: "App/Search/SearchResultCard",
  component: SearchResultCard,
  decorators: [(Story) => <div className={css({ p: "4" })}>{Story()}</div>],
  args: {
    href: "/materials/1",
    name: "根張りエース",
    maker: "みどり化成工業",
    rating: 4.3,
    reviewCount: 18,
    reportCount: 4,
    savedCount: 27,
    description:
      "定植前の土壌に混和して使う微生物資材。根の伸長を促し、活着を早める。トマト・きゅうりなど果菜類の育苗期から使える。",
    categories: ["微生物資材", "海藻・海藻抽出物（アルギン酸・ラミナリンなどを含むもの）"],
    directEvidence: ["トマト"],
    groupEvidence: [],
    imageSrc: storyThumbnail,
  },
} satisfies Meta<typeof SearchResultCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sparse: Story = {
  args: {
    rating: null,
    reviewCount: 0,
    reportCount: 0,
    savedCount: 0,
    description: null,
    categories: [],
    directEvidence: [],
    groupEvidence: ["果菜類"],
    imageSrc: undefined,
  },
};
