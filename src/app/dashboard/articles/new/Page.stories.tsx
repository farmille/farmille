import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/dashboard/articles/new",
  component: Page,
  beforeEach: () => preparePageSession("seller"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/dashboard/articles/new" } },
  },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
