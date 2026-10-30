import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { OtpInput } from "./OtpInput";

const meta = {
  title: "Components/Form/OtpInput",
  component: OtpInput,
  args: { label: "認証コード", name: "code" },
} satisfies Meta<typeof OtpInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Typing: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByLabelText("認証コード"), "123");
  },
};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByLabelText("認証コード"), "123456");
  },
};

export const InField: Story = {
  args: {
    description: "認証アプリに表示されている6桁の数字を入力します。",
    requirement: "required",
  },
};

export const Invalid: Story = {
  args: { error: "認証コードが正しくありません。", requirement: "required" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
