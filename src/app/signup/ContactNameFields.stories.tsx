import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { ContactNameFields } from "./ContactNameFields";

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "Pages/Shared/ContactNameFields",
  component: ContactNameFields,
  decorators: [fmDecorator],
  args: { values: {} },
} satisfies Meta<typeof ContactNameFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = {
  args: { values: { familyName: "山田", givenName: "太郎", phone: "090-1234-5678" } },
};
