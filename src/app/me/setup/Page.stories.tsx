import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { mocked } from "storybook/test";
import { getOwnProfile } from "@/server/queries/profiles";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/me/setup",
  component: Page,
  beforeEach: () => {
    const cleanup = preparePageSession("general");
    mocked(getOwnProfile).mockResolvedValue({ ok: false, error: "not_found" });
    return () => {
      mocked(getOwnProfile).mockReset();
      cleanup();
    };
  },
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/me/setup" } } },
  args: {},
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
