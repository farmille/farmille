import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox, checkboxChipStyle } from "./Checkbox";
const meta = { title: "Components/Checkbox", component: Checkbox } satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <label className={checkboxChipStyle}>
      <Checkbox />
      栽培開始前
    </label>
  ),
};
export const Checked: Story = {
  render: () => (
    <label className={checkboxChipStyle}>
      <Checkbox defaultChecked />
      播種・定植時
    </label>
  ),
};
export const Disabled: Story = {
  render: () => (
    <label className={checkboxChipStyle}>
      <Checkbox disabled />
      栽培開始前
    </label>
  ),
};
