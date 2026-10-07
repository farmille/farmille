import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeInvitations } from "./HomeInvitations";

const meta = {
  title: "App/Home/Invitations",
  component: HomeInvitations,
  decorators: [
    (Story) => (
      <div className="fm">
        <div className={css({ px: "4", pb: "6" })}>{Story()}</div>
      </div>
    ),
  ],
  args: { showSignup: true },
} satisfies Meta<typeof HomeInvitations>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Guest: Story = {};
export const SignedIn: Story = { args: { showSignup: false } };
