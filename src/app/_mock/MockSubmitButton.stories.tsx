import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MockSubmitButton } from "./MockSubmitButton";

const meta = {
  title: "App/Mock/MockSubmitButton",
  component: MockSubmitButton,
  decorators: [(Story) => <form className="fm">{Story()}</form>],
  args: { label: "保存する", pendingLabel: "保存中…" },
} satisfies Meta<typeof MockSubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };
