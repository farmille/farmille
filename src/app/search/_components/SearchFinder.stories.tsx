import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchFinder } from "./SearchFinder";
import { storyCatalog, storyIds } from "./story-fixtures";

const scope = {
  catalog: storyCatalog,
  filters: [],
  makerNames: [],
  materialNames: [],
  keyword: undefined,
};

const meta = {
  title: "Pages/search/SearchFinder",
  component: SearchFinder,
  args: { scope, selected: [], sort: "reviews", query: "", resultCount: 3 },
} satisfies Meta<typeof SearchFinder>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 何も選んでいないとき。帯はホームと同じ水田の写真。 */
export const Default: Story = {};

/** 作物を選ぶと帯の写真が替わり、効果の件数はその作物の中で数える。 */
export const CropSelected: Story = {
  args: {
    scope: { ...scope, filters: [{ category: "crop", id: storyIds.tomato }] },
    selected: [{ kind: "filter", category: "crop", id: storyIds.tomato, name: "トマト" }],
    resultCount: 2,
  },
};

/** 写真を用意していない作物は、同じ大きさの丸に頭文字を置く。 */
export const CropWithoutPhoto: Story = {
  args: {
    scope: {
      ...scope,
      catalog: {
        ...storyCatalog,
        crops: storyCatalog.crops.map((crop) =>
          crop.id === storyIds.onion ? { ...crop, name: "らっきょう", aliases: [] } : crop,
        ),
      },
    },
  },
};
