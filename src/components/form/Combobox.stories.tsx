import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Combobox } from "./Combobox";
import { Field } from "./Field";
import type { Option } from "./types";

const tomato: Option = { value: "tomato", label: "トマト", description: "なす科果菜類" };
const strawberry: Option = { value: "strawberry", label: "いちご", description: "ばら科果菜類" };
const cucumber: Option = { value: "cucumber", label: "きゅうり", description: "うり科果菜類" };

const crops: Option[] = [
  tomato,
  { value: "mini-tomato", label: "ミニトマト", description: "なす科果菜類" },
  { value: "eggplant", label: "なす", description: "なす科果菜類" },
  strawberry,
  cucumber,
  { value: "spinach", label: "ほうれんそう", description: "ひゆ科葉菜類" },
  { value: "mikan", label: "温州みかん", description: "かんきつ類" },
  { value: "rice", label: "水稲", description: "いね科", disabled: true },
];

const meta = {
  title: "Components/Form/Combobox",
  component: Combobox,
  args: {
    "aria-label": "作目",
    options: crops,
    placeholder: "作物名を入力（例：みかん、デコポン）",
    emptyMessage: "一致する作物がありません。",
    onValueChange: fn(),
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

async function openList({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("combobox"));
  await waitFor(() => expect(page(canvasElement).getByRole("listbox")).toBeVisible());
}

export const Default: Story = {};

export const Selected: Story = {
  args: { defaultValue: tomato },
};

/** 一覧を開いた状態。説明は右に小さく、選べない候補は薄く出す。 */
export const Open: Story = {
  args: { defaultValue: strawberry },
  play: openList,
};

export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox"), "トマト");
    await waitFor(() => expect(page(canvasElement).getAllByRole("option")).toHaveLength(2));
  },
};

export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox"), "りんご");
    await waitFor(() =>
      expect(page(canvasElement).getByText("一致する作物がありません。")).toBeVisible(),
    );
  },
};

/** 複数選択。選んだ作物は入力欄の中のチップで示し、チップの × で外す。 */
export const Multiple: Story = {
  args: { multiple: true, defaultValue: [tomato, cucumber] },
};

export const MultipleOpen: Story = {
  args: { multiple: true, defaultValue: [tomato, cucumber] },
  play: openList,
};

/** 上限に達すると入力欄は読み取り専用になり、選んでいない候補は押せない。 */
export const MultipleAtMax: Story = {
  args: { multiple: true, max: 2, defaultValue: [tomato, cucumber] },
  play: openList,
};

export const InField: Story = {
  render: (args) => (
    <Field
      description="作物名や別名で検索して選んでください。"
      label="作目"
      name="cropId"
      requirement="required"
    >
      <Combobox {...args} aria-label={undefined} />
    </Field>
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <Field error="作目を1つ選んでください。" label="作目" name="cropId" requirement="required">
      <Combobox {...args} aria-label={undefined} />
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: tomato },
};
