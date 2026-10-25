import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { Reveal } from "./Reveal";

const block = css({ p: "6", bg: "surface.card", borderRadius: "banner", textStyle: "body" });

const meta = {
  title: "Pages/Home/Reveal",
  component: Reveal,
  args: { children: <p className={block}>画面に入ると現れる要素</p> },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rise: Story = {};
export const Settle: Story = { args: { effect: "settle" } };
export const Fade: Story = { args: { effect: "fade", delay: "2" } };
