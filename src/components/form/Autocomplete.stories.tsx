import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useReducer, type ComponentProps } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { css } from "../../../styled-system/css";
import { Autocomplete } from "./Autocomplete";
import type { Option } from "./types";

const affiliations: Option[] = [
  { value: "ja-tomato", label: "JAトマト部会" },
  { value: "ja-strawberry", label: "JAいちご部会" },
  { value: "kenkyukai", label: "地域土づくり研究会" },
];

const searchSuggestions: Option[] = [
  { value: "crop:onion", label: "たまねぎ", description: "作物" },
  { value: "concern:onion-rot", label: "たまねぎの腐敗", description: "悩み" },
  { value: "name:onion-fertilizer", label: "たまねぎ専用有機肥料", description: "資材名" },
];

function StatefulAutocomplete(args: ComponentProps<typeof Autocomplete>) {
  const [value, setValue] = useReducer((_current: string, next: string) => next, args.value);
  return (
    <Autocomplete
      {...args}
      onPick={(option) => {
        setValue("");
        args.onPick?.(option);
      }}
      onValueChange={(next) => {
        setValue(next);
        args.onValueChange(next);
      }}
      value={value}
    />
  );
}

const meta = {
  title: "Components/Form/Autocomplete",
  component: Autocomplete,
  args: {
    label: "所属",
    value: "",
    options: affiliations,
    placeholder: "〇〇市トマト生産部会",
    onValueChange: fn(),
    onPick: fn(),
    onSubmitText: fn(),
  },
  render: (args) => <StatefulAutocomplete {...args} />,
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

async function typeQuery(canvasElement: HTMLElement, text: string) {
  await userEvent.type(within(canvasElement).getByRole("combobox"), text);
}

export const Default: Story = {};

export const Suggestions: Story = {
  play: async ({ canvasElement }) => {
    await typeQuery(canvasElement, "JA");
    await waitFor(() => expect(page(canvasElement).getAllByRole("option")).toHaveLength(2));
  },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const NoMatches: Story = {
  args: { emptyMessage: "一致する候補がありません。" },
  play: async ({ canvasElement }) => {
    await typeQuery(canvasElement, "りんご");
    await waitFor(() =>
      expect(page(canvasElement).getByText("一致する候補がありません。")).toBeVisible(),
    );
  },
};

const tagStyle = css({
  py: "0.5",
  px: "1.5",
  borderRadius: "mark",
  bg: "primary.soft",
  color: "text.brandOnSoft",
  fontSize: "xs",
  fontWeight: "bold",
});

export const Search: Story = {
  args: {
    hideLabel: true,
    label: "資材の検索条件",
    size: "search",
    options: searchSuggestions,
    placeholder: "作物・悩み・資材名を入力してください",
    renderOption: (option) => (
      <>
        <span className={tagStyle}>{option.description}</span>
        <span>{option.label}</span>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await typeQuery(canvasElement, "たまねぎ");
    await waitFor(() => expect(page(canvasElement).getAllByRole("option")).toHaveLength(3));
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: "JAトマト部会" },
};
