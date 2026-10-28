import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { getOwnRegisteredContact } from "@/server/accounts/registered-address";

import Page from "./page";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/account/contact",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/account/contact" } } },
  args: {},
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

// 連絡先の行が無いアカウント。都道府県だけが入った状態で開く。
export const WithoutContact: Story = {
  beforeEach: () => {
    mocked(getOwnRegisteredContact).mockResolvedValue({
      ok: true,
      data: { prefectureCode: 8, contact: null },
    });
  },
};
