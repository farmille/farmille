import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { userEvent, within } from "storybook/test";
import { css } from "../../../styled-system/css";
import { PostalAddressFields } from "./PostalAddressFields";
const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "Pages/signup/PostalAddressFields",
  component: PostalAddressFields,
  decorators: [fmDecorator],
  args: {
    values: { postalCode: "1000001", prefectureCode: "13", cityStreet: "千代田区千代田" },
  },
} satisfies Meta<typeof PostalAddressFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LookupCompleted: Story = {
  args: { values: { postalCode: "1000001" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "住所を自動入力" }));
  },
};
