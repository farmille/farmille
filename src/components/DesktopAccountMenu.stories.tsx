import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { DesktopAccountMenu } from "./DesktopAccountMenu";

const SESSION_COOKIE = "sb-storybook-auth-token";

async function openMenu({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "アカウント" }));
}

const meta = {
  title: "Components/DesktopAccountMenu",
  component: DesktopAccountMenu,
  args: { myPageCurrent: false },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DesktopAccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GuestOpen: Story = { play: openMenu };

export const MyPage: Story = {
  args: { myPageCurrent: true },
  beforeEach: () => {
    document.cookie = `${SESSION_COOKIE}=session; path=/`;
    return () => {
      document.cookie = `${SESSION_COOKIE}=; Max-Age=0; path=/`;
    };
  },
  play: openMenu,
};
