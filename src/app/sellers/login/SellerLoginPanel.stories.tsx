import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";

import { SellerLoginPanel } from "./SellerLoginPanel";

const meta = {
  title: "Pages/sellers/login/SellerLoginPanel",
  component: SellerLoginPanel,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>],
  args: { destinationLabel: null, next: null, passwordChanged: false },
} satisfies Meta<typeof SellerLoginPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDestination: Story = {
  args: { destinationLabel: "企業会員ダッシュボード", next: "/dashboard", passwordChanged: true },
};
