import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { Avatar } from "./Avatar";
import { DesktopAccountMenu } from "./DesktopAccountMenu";

const photo =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152"><rect width="152" height="152" fill="#C8E6C9"/><circle cx="76" cy="60" r="28" fill="#2E7D32"/></svg>',
  );

const SESSION_COOKIE = "sb-storybook-auth-token";

async function openMenu({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "アカウント" }));
}

const meta = {
  title: "Pages/Shared/DesktopAccountMenu",
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

/** サーバーが会員と確かめた閲覧者には本人の画像を出し、開くと cookie が無くても会員の項目を出す。 */
export const WithAvatar: Story = {
  args: { member: { avatar: <Avatar name="緑の畑" src={photo} size="md" /> } },
  play: openMenu,
};
