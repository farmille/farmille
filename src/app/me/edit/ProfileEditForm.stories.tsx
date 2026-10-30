import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";

import { Avatar } from "@/components/Avatar";

import { ownProfile } from "../_components/story-fixtures";
import { ProfileEditForm } from "./ProfileEditForm";
import { updateProfileAction } from "./actions";
import { persistKey } from "@/components/form/persisted-input";

const meta = {
  title: "Pages/me/edit/ProfileEditForm",
  component: ProfileEditForm,
  args: {
    avatar: <Avatar name={ownProfile.handle} src={ownProfile.avatarUrl} size="xs" />,
    profile: ownProfile,
    details: {
      standpoint: "farmer",
      prefecture_code: 8,
      bio: "",
      affiliations: [],
      crops: [],
      cropNamesOther: [],
      links: [],
    },
    options: {
      crops: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          name: "いちご",
          aliases: ["苺"],
          crop_groups: { name: "その他" },
        },
      ],
      affiliations: ["JA青年部"],
    },
  },
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RestoredAfterError: Story = {
  parameters: { nextjs: { navigation: { pathname: "/me/edit" } } },
  beforeEach: () => {
    const key = persistKey("profile", "/me/edit");
    sessionStorage.setItem(
      key,
      JSON.stringify({
        cropIds: ["10000000-0000-4000-8000-000000000001"],
        affiliations: ["復元した部会"],
      }),
    );
    mocked(updateProfileAction).mockResolvedValue({
      status: "error",
      message: "ニックネームが重複しています。",
    });
    return () => {
      sessionStorage.removeItem(key);
      mocked(updateProfileAction).mockReset();
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("button", { name: "復元した部会を削除" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "保存する" }));
    await expect(await canvas.findByText("ニックネームが重複しています。")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "復元した部会を削除" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "いちごを削除" })).toBeVisible();
  },
};
