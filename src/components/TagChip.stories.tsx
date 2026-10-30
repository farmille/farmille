import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { css } from "../../styled-system/css";
import { TagChip } from "./TagChip";

const meta = {
  title: "Pages/Shared/TagChip",
  component: TagChip,
  args: {
    label: "トマト（施設）",
    category: "crop",
  },
} satisfies Meta<typeof TagChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CategoryCrop: Story = {
  args: {
    label: "トマト（施設）",
    category: "crop",
  },
};

export const CategoryConcern: Story = {
  args: {
    label: "うどんこ病",
    category: "concern",
  },
};

export const CategoryEffect: Story = {
  args: {
    label: "土壌改良",
    category: "effect",
  },
};

export const CategoryCond: Story = {
  args: {
    label: "施設栽培",
    category: "cond",
  },
};

export const CategoryType: Story = {
  args: {
    label: "微生物資材",
    category: "genre",
  },
};

export const CategoryMaker: Story = {
  args: {
    label: "グリーンバイオ株式会社",
    category: "maker",
  },
};

export const CategoryName: Story = {
  args: {
    label: "バチルス菌体資材 ツチイキル",
    category: "name",
  },
};

/** 全カテゴリの色分けを一覧で確認するためのギャラリー。 */
export const AllCategories: Story = {
  render: () => (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
      <TagChip label="トマト（施設）" category="crop" />
      <TagChip label="うどんこ病" category="concern" />
      <TagChip label="土壌改良" category="effect" />
      <TagChip label="施設栽培" category="cond" />
      <TagChip label="微生物資材" category="genre" />
      <TagChip label="グリーンバイオ株式会社" category="maker" />
      <TagChip label="バチルス菌体資材 ツチイキル" category="name" />
    </div>
  ),
};

export const Plain: Story = {
  args: {
    appearance: "plain",
    label: "水稲",
    category: "crop",
  },
};

export const Suggestion: Story = {
  args: {
    appearance: "suggestion",
    label: "連作障害",
    category: "concern",
  },
};

export const SuggestionSelected: Story = {
  args: {
    appearance: "suggestion",
    selected: true,
    label: "連作障害",
    category: "concern",
  },
};

export const Removable: Story = {
  args: {
    label: "キュウリ",
    category: "crop",
    onRemove: fn(),
  },
};

export const Clickable: Story = {
  args: {
    label: "ホウレンソウ",
    category: "crop",
    onClick: fn(),
  },
};
