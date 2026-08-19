import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DataList, type DataListRow } from "./DataList";

const organizationRows: DataListRow[] = [
  { label: "法人名", value: "グリーンバイオ株式会社" },
  { label: "所在地", value: "北海道帯広市西18条南5丁目1-1" },
  { label: "電話番号", value: "0155-12-3456" },
  { label: "担当者", value: "佐藤 一郎" },
];

const meta = {
  title: "Components/DataList",
  component: DataList,
  args: {
    rows: organizationRows,
  },
} satisfies Meta<typeof DataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleRow: Story = {
  args: {
    rows: [{ label: "作物", value: "トマト（施設）" }],
  },
};

export const ManyRows: Story = {
  args: {
    rows: [
      { label: "法人名", value: "グリーンバイオ株式会社" },
      { label: "所在地", value: "北海道帯広市西18条南5丁目1-1" },
      { label: "電話番号", value: "0155-12-3456" },
      { label: "担当者", value: "佐藤 一郎" },
      { label: "設立年", value: "1998年" },
      { label: "従業員数", value: "42名" },
      { label: "取扱作物", value: "水稲・トマト・キュウリ" },
    ],
  },
};

export const EmptyValues: Story = {
  args: {
    rows: [
      { label: "法人名", value: "グリーンバイオ株式会社" },
      { label: "ウェブサイト", value: "" },
      { label: "担当者", value: null },
    ],
  },
};

export const CustomEmptyLabel: Story = {
  args: {
    rows: [
      { label: "法人名", value: "グリーンバイオ株式会社" },
      { label: "ウェブサイト", value: undefined },
    ],
    emptyLabel: "非公開",
  },
};

export const LongValue: Story = {
  args: {
    rows: [
      {
        label: "備考",
        value:
          "定植前の土壌灌注に加え、生育期の追肥時にも継続して使用することで団粒構造の形成が進み、排水性が明らかに改善した圃場の記録です。",
      },
    ],
  },
};

export const NoRows: Story = {
  args: {
    rows: [],
  },
};
