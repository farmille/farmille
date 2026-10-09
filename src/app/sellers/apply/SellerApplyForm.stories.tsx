import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { SellerApplyForm } from "./SellerApplyForm";

const meta = {
  title: "App/Sellers/SellerApplyForm",
  component: SellerApplyForm,
  decorators: [(Story) => <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>],
} satisfies Meta<typeof SellerApplyForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
