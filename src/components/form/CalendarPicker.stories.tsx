import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { CalendarPicker } from "./CalendarPicker";

const meta = {
  title: "Components/Form/CalendarPicker",
  component: CalendarPicker,
  args: {
    value: [],
    onChange: fn(),
    initialMonth: "2026-08",
    emptyMessage: "使用日を選択してください",
    ariaLabel: "使用日の選択カレンダー",
  },
} satisfies Meta<typeof CalendarPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 初期値なし（空メッセージを表示） */
export const Empty: Story = {};

/** 複数日を選択済み（チップと選択セルの表示） */
export const MultipleSelected: Story = {
  args: {
    value: ["2026-08-03", "2026-08-12", "2026-08-21"],
  },
};

/** 単一選択モード・初期値あり */
export const SingleSelected: Story = {
  args: {
    single: true,
    value: ["2026-08-15"],
    emptyMessage: "収穫日を選択してください",
    ariaLabel: "収穫日の選択カレンダー",
  },
};

/** 単一選択モード・初期値なし */
export const SingleEmpty: Story = {
  args: {
    single: true,
    emptyMessage: "収穫日を選択してください",
    ariaLabel: "収穫日の選択カレンダー",
  },
};

/** チップに接尾辞を付ける（散布日の記録） */
export const WithSuffix: Story = {
  args: {
    value: ["2026-07-28", "2026-08-05"],
    suffix: "に散布",
    emptyMessage: "散布日を選択してください",
    ariaLabel: "散布日の選択カレンダー",
  },
};
