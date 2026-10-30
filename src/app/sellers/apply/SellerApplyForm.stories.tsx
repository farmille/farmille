import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { css } from "../../../../styled-system/css";

import { SellerApplyForm } from "./SellerApplyForm";

const meta = {
  title: "Pages/sellers/apply/SellerApplyForm",
  component: SellerApplyForm,
  decorators: [(Story) => <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>],
} satisfies Meta<typeof SellerApplyForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InviteCodeOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /招待コード入力/ }));
  },
};
