import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { RegistrationTerms } from "./RegistrationTerms";
import { SignupForm } from "./SignupForm";

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "Pages/signup/SignupForm",
  component: SignupForm,
  decorators: [fmDecorator],
  args: { email: "farmer@example.test", termsContent: <RegistrationTerms /> },
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
