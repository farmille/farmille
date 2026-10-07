import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeHeroSearch } from "./HomeHeroSearch";
import { heroSearchOptions } from "./story-fixtures";

const meta = {
  title: "App/Home/HomeHeroSearch",
  component: HomeHeroSearch,
  decorators: [(Story) => <div className={css({ bg: "primary.800", p: "6" })}>{Story()}</div>],
  args: { options: heroSearchOptions },
} satisfies Meta<typeof HomeHeroSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { options: null } };
