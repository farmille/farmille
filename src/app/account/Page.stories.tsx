import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";

import { getOwnRegisteredContact } from "@/server/accounts/registered-address";

import Page from "./page";
import { preparePageSession } from "../../../.storybook/page-session";

const meta = {
  title: "Pages/account",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/account" } } },
  args: {},
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const contact = canvas.getByRole("region", { name: "本人情報" });
    await expect(
      within(contact).getByRole("link", { name: "氏名・住所・電話 山田 太郎・茨城県" }),
    ).toHaveAttribute("href", "/account/contact");
    const security = canvas.getByRole("region", { name: "ログインとセキュリティ" });
    await expect(within(security).getByRole("link", { name: "パスワードを変更" })).toHaveAttribute(
      "href",
      "/account/password",
    );
    await expect(within(security).getByRole("link", { name: "パスキーを管理" })).toHaveAttribute(
      "href",
      "/account/passkeys",
    );
  },
};

// 連絡先の行が無いアカウント。本人情報の行は「未登録」と出る。
export const WithoutContact: Story = {
  beforeEach: () => {
    mocked(getOwnRegisteredContact).mockResolvedValue({
      ok: true,
      data: { prefectureCode: 8, contact: null },
    });
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "氏名・住所・電話 未登録" }),
    ).toBeVisible();
  },
};
