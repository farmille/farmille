import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { css, cx } from "../../../styled-system/css";
import { AccountTypeChoice } from "./AccountTypeChoice";

const fmDecorator: Decorator = (Story) => (
  <div className={cx("fm", css({ p: "4" }))}>{Story()}</div>
);

const meta = {
  title: "App/Auth/AccountTypeChoice",
  component: AccountTypeChoice,
  decorators: [fmDecorator],
} satisfies Meta<typeof AccountTypeChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
