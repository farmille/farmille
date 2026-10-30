import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/sellers/procedures/[slug]",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/sellers/procedures/owner" } },
  },
  args: { params: Promise.resolve({ slug: "owner" }) },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
