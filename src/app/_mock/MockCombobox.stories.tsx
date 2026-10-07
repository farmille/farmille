import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { css } from "../../../styled-system/css";

import { MockCombobox, type MockComboboxOption } from "./MockCombobox";

const crops: MockComboboxOption[] = [
  { value: "1", label: "いちご", description: "野菜類" },
  { value: "2", label: "トマト", description: "なす科果菜類" },
  { value: "3", label: "きゅうり", description: "うり類" },
  { value: "4", label: "ほうれん草" },
];

const meta = {
  title: "App/Mock/MockCombobox",
  component: MockCombobox,
  decorators: [
    (Story) => (
      <div className="fm">
        <div className={css({ minH: "72" })}>{Story()}</div>
      </div>
    ),
  ],
  args: {
    id: "crop-search",
    "aria-label": "主な作目",
    placeholder: "作物名を入力（例：みかん、デコポン）",
    value: "",
    options: crops,
    onValueChange: fn(),
    onSelect: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <MockCombobox {...args} value={value} onValueChange={setValue} />;
  },
} satisfies Meta<typeof MockCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox");
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");
    await expect(within(canvasElement).getByRole("listbox")).toBeVisible();
  },
};

export const NoMatch: Story = {
  args: { options: [], value: "みかん" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox"));
  },
};

export const Disabled: Story = { args: { disabled: true } };
