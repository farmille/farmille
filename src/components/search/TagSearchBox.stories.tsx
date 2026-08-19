import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import type { TagListItem } from "@/server/queries/tags";
import { TagSearchBox } from "./TagSearchBox";
import type { SelectedSearchTag } from "./tag-selection";

const popularTags: TagListItem[] = [
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000001",
    name: "高温対策",
    category: "concern",
    sort_order: 1,
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000002",
    name: "ミニトマト",
    category: "crop",
    sort_order: 2,
  },
  { id: "1c9a7e58-2f34-4b6d-9a01-000000000003", name: "いちご", category: "crop", sort_order: 3 },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000004",
    name: "根張り改善",
    category: "concern",
    sort_order: 4,
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000005",
    name: "施設園芸",
    category: "condition",
    sort_order: 5,
  },
];

const seasonalTags: TagListItem[] = [
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000006",
    name: "夏の暑さ対策",
    category: "concern",
    sort_order: 1,
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000007",
    name: "草勢維持",
    category: "effect",
    sort_order: 2,
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000008",
    name: "葉面散布",
    category: "effect",
    sort_order: 3,
  },
];

const catalogTags: TagListItem[] = [
  ...popularTags,
  ...seasonalTags,
  { id: "1c9a7e58-2f34-4b6d-9a01-000000000009", name: "トマト", category: "crop", sort_order: 6 },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000010",
    name: "うどんこ病対策",
    category: "concern",
    sort_order: 7,
  },
  {
    id: "1c9a7e58-2f34-4b6d-9a01-000000000011",
    name: "微生物資材",
    category: "type",
    sort_order: 8,
  },
];

const catalog = {
  tags: catalogTags,
  makers: ["グリーンバイオ株式会社", "大地の恵み農材"],
  materialNames: [
    "バチルス菌体資材 ツチイキル",
    "木酢液プレミアム",
    "トリコデルマ菌床 ネマガード",
    "トマト元気バイオ液肥",
  ],
};

/** タグ・メーカー・資材名が混在した選択状態（カテゴリ別チップの表示確認用） */
const mixedSelected: SelectedSearchTag[] = [
  {
    kind: "tag",
    id: "1c9a7e58-2f34-4b6d-9a01-000000000002",
    name: "ミニトマト",
    category: "crop",
    dbCategory: "crop",
  },
  {
    kind: "tag",
    id: "1c9a7e58-2f34-4b6d-9a01-000000000005",
    name: "施設園芸",
    category: "cond",
    dbCategory: "condition",
  },
  { kind: "maker", name: "グリーンバイオ株式会社" },
  { kind: "name", name: "木酢液プレミアム" },
];

const meta = {
  title: "Components/Search/TagSearchBox",
  component: TagSearchBox,
  args: {
    selected: [],
    sort: "reviews",
    popular: popularTags,
    seasonal: seasonalTags,
    catalog,
    variant: "home",
  },
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
  },
} satisfies Meta<typeof TagSearchBox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ホーム画面（未選択・おすすめパネル表示） */
export const Home: Story = {};

/** 検索画面（タグ・メーカー・資材名の混在選択。選択済みタグはおすすめから除外される） */
export const SearchWithSelected: Story = {
  args: {
    selected: mixedSelected,
    variant: "search",
  },
  parameters: {
    nextjs: { navigation: { pathname: "/search" } },
  },
};

/** 入力中（「トマト」でタグ・資材名の候補パネルを表示） */
export const Suggesting: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "タグ検索" }), "トマト");
  },
};

/** 一致する候補が無い入力 */
export const NoMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "タグ検索" }), "アスパラガス");
  },
};

/** プレースホルダー差し替え */
export const CustomPlaceholder: Story = {
  args: {
    placeholder: "追加する条件を入力",
    variant: "search",
  },
  parameters: {
    nextjs: { navigation: { pathname: "/search" } },
  },
};
