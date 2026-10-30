import { Icon } from "@/components/Icon";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../styled-system/css";

import { NoImage, Stars } from "./CardParts";

const row = css({ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "3", mb: "4" });
const imageBox = css({ w: "24", h: "16" });

const meta = {
  title: "Pages/materials/[id]/CardParts",
  component: Stars,
  args: { value: 4 },
} satisfies Meta<typeof Stars>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StarValues: Story = {
  render: () => (
    <div className={row}>
      <Stars value={0} />
      <Stars value={3.4} />
      <Stars value={5} />
    </div>
  ),
};

export const NoImageAndIcons: Story = {
  render: () => (
    <div className={row}>
      <div className={imageBox}>
        <NoImage />
      </div>
      <Icon name="check" size="sm" />
      <Icon name="open_in_new" size="2xs" />
    </div>
  ),
};
