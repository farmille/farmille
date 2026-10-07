import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { SellerLoginForm } from "./SellerLoginForm";

const meta = {
  title: "App/Sellers/SellerLoginForm",
  component: SellerLoginForm,
  args: { next: null },
  decorators: [(Story) => <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>],
} satisfies Meta<typeof SellerLoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithReturnPath: Story = {
  args: { next: "/dashboard" },
};
