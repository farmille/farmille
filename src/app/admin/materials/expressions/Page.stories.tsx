import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/admin/materials/expressions",
  component: Page,
  beforeEach: () => preparePageSession("admin"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/admin/materials/expressions" } },
  },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
