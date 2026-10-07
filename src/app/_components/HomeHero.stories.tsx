import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { HomeHero } from "./HomeHero";
import { heroSearchOptions } from "./story-fixtures";

const meta = {
  title: "App/Home/HomeHero",
  component: HomeHero,
  parameters: { layout: "fullscreen" },
  args: { searchOptions: heroSearchOptions },
} satisfies Meta<typeof HomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = { args: { searchOptions: null } };

export const PillOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /作物/ }));
  },
};

export const Suggestions: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("searchbox"), "ツチ");
  },
};

export const NoSuggestion: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("searchbox"), "該当なし");
  },
};
