import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DataTable, type DataTableColumn } from "./DataTable";

type MaterialRow = {
  id: string;
  name: string;
  maker: string;
  productType: string;
  claimStatus: string;
  reviewCount: number;
};

const rows: MaterialRow[] = [
  {
    id: "m-1",
    name: "バチルス菌体資材 ツチイキル",
    maker: "グリーンバイオ株式会社",
    productType: "微生物資材",
    claimStatus: "claim 済み",
    reviewCount: 128,
  },
  {
    id: "m-2",
    name: "木酢液プレミアム",
    maker: "大地の恵み農材",
    productType: "植物活力剤",
    claimStatus: "未 claim",
    reviewCount: 64,
  },
  {
    id: "m-3",
    name: "トリコデルマ菌床 ネマガード",
    maker: "北海道バイオ研究所",
    productType: "微生物資材",
    claimStatus: "claim 済み",
    reviewCount: 12,
  },
];

const columns: DataTableColumn<MaterialRow>[] = [
  { key: "name", header: "資材名", cell: (row) => row.name },
  { key: "maker", header: "メーカー名", cell: (row) => row.maker },
  { key: "productType", header: "種別", cell: (row) => row.productType },
  { key: "reviewCount", header: "感想口コミ", align: "end", cell: (row) => row.reviewCount },
];

const wideColumns: DataTableColumn<MaterialRow>[] = [
  ...columns,
  { key: "claimStatus", header: "claim", cell: (row) => row.claimStatus },
];

const meta = {
  title: "Components/Display/DataTable",
  component: DataTable<MaterialRow>,
  args: {
    columns,
    rows,
    rowKey: (row: MaterialRow) => row.id,
  },
} satisfies Meta<typeof DataTable<MaterialRow>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    rows: [],
  },
};

export const CustomEmptyMessage: Story = {
  args: {
    rows: [],
    emptyMessage: "条件に合う資材が見つかりません。",
  },
};

export const WideColumns: Story = {
  args: {
    columns: wideColumns,
  },
};

export const WideColumnsOnTablet: Story = {
  args: {
    columns: wideColumns,
  },
  globals: {
    viewport: { value: "tablet", isRotated: false },
  },
};
