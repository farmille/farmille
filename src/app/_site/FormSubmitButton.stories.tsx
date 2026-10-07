import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormSubmitButton } from "./FormSubmitButton";

const meta = {
  title: "App/Site/FormSubmitButton",
  component: FormSubmitButton,
  decorators: [(Story) => <form>{Story()}</form>],
  args: { label: "保存する", pendingLabel: "保存中…" },
} satisfies Meta<typeof FormSubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };
