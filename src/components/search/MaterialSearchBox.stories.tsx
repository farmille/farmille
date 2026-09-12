import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import type { SearchFilterItem } from "@/lib/material-search";
import { MaterialSearchBox } from "./MaterialSearchBox";
import type { SelectedSearchFilter } from "./search-selection";

const popular: SearchFilterItem[] = [
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000001",
    name: "高温対策",
    category: "concern",
    sort_order: 1,
    aliases: [],
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000002",
    name: "ミニトマト",
    category: "crop",
    sort_order: 2,
    aliases: ["プチトマト"],
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000003",
    name: "いちご",
    category: "crop",
    sort_order: 3,
    aliases: [],
  },
];

const seasonal: SearchFilterItem[] = [
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000004",
    name: "夏の暑さ対策",
    category: "concern",
    sort_order: 1,
    aliases: [],
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000005",
    name: "樹勢改善",
    category: "effect",
    sort_order: 2,
    aliases: [],
  },
];

const catalog = {
  filters: [
    ...popular,
    ...seasonal,
    {
      id: "1c9a7e58-2f34-4b6d-9a01-000000000006",
      name: "微生物資材",
      category: "type" as const,
      sort_order: 1,
      aliases: [],
    },
  ],
  makers: ["グリーンバイオ株式会社", "大地の恵み農材"],
  materialNames: ["バチルス菌体資材 ツチイキル", "トマト元気バイオ液肥"],
};

const selected: SelectedSearchFilter[] = [
  {
    kind: "filter",
    id: "1c9a7e58-2f34-4b6d-9a01-000000000002",
    name: "ミニトマト",
    category: "crop",
  },
  { kind: "maker", name: "グリーンバイオ株式会社" },
];

const meta = {
  title: "Components/Search/MaterialSearchBox",
  component: MaterialSearchBox,
  args: {
    initialQuery: "",
    selected: [],
    sort: "reviews",
    popular,
    seasonal,
    catalog,
  },
  parameters: { nextjs: { navigation: { pathname: "/search" } } },
} satisfies Meta<typeof MaterialSearchBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelected: Story = { args: { selected } };

// URL の q 付きで着地した直後。入力欄に初期値が入り、候補パネルがすでに開いている。
export const WithInitialQuery: Story = { args: { initialQuery: "トマト" } };

export const Suggesting: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("textbox", { name: "資材の検索条件" }),
      "トマト",
    );
  },
};

export const NoMatch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("textbox", { name: "資材の検索条件" }),
      "アスパラガス",
    );
  },
};
