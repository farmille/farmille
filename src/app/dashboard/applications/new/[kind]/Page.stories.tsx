import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../../.storybook/page-session";

const meta = {
  title: "Pages/dashboard/applications/new/[kind]",
  component: Page,
  beforeEach: () => preparePageSession("seller"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/dashboard/applications/new/registration" } },
  },
  args: { params: Promise.resolve({ kind: "registration" }) },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
