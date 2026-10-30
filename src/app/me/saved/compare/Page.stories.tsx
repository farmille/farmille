import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/me/saved/compare",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/me/saved/compare" } } },
  args: {
    searchParams: Promise.resolve({
      ids: "00000000-0000-4000-8000-000000000101,00000000-0000-4000-8000-000000000102",
    }),
  },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
