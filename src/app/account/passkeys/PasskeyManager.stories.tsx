import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PasskeyManager } from "./PasskeyManager";

const meta = {
  title: "App/Auth/PasskeyManager",
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
