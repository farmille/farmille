import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../styled-system/css";
import { HomeFooter } from "./HomeFooter";
const meta = { title: "Pages/Home/HomeFooter", component: HomeFooter } satisfies Meta<
  typeof HomeFooter
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Forest: Story = {
  args: { tone: "forest" },
  decorators: [
    (Story) => (
      <div className={css({ p: "5", bg: "surface.forest" })}>
        <Story />
      </div>
    ),
  ],
};
