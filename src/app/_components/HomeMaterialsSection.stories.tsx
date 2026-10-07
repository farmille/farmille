import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeMaterialsSection } from "./HomeMaterialsSection";
import { homeMaterials } from "./story-fixtures";

const meta = {
  title: "App/Home/HomeMaterialsSection",
  component: HomeMaterialsSection,
  decorators: [(Story) => <div className={css({ px: "4" })}>{Story()}</div>],
  args: { materials: homeMaterials },
} satisfies Meta<typeof HomeMaterialsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { materials: [] } };
export const Loading: Story = { args: { materials: null } };
