import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { css, cx } from "../../../styled-system/css";
import { SignupForm } from "./SignupForm";

const fmDecorator: Decorator = (Story) => (
  <div className={cx("fm", css({ p: "4" }))}>{Story()}</div>
);

const meta = {
  title: "App/Auth/SignupForm",
  component: SignupForm,
  decorators: [fmDecorator],
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
