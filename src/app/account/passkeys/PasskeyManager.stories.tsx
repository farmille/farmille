import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { PasskeyManager } from "./PasskeyManager";

const meta = {
  title: "Pages/account/passkeys/PasskeyManager",
  component: PasskeyManager,
  args: { passkeys: [], admin: false },
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof PasskeyManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Registered: Story = {
  args: {
    passkeys: [
      {
        id: "sample-passkey",
        friendly_name: "iCloudキーチェーン",
        created_at: "2026-09-10T00:00:00Z",
      },
    ],
  },
};

export const Admin: Story = { args: { admin: true } };

export const DeleteConfirm: Story = {
  args: Registered.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "削除" }));
    await waitFor(() =>
      expect(within(canvasElement.ownerDocument.body).getByRole("alertdialog")).toBeVisible(),
    );
  },
};
