import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/sellers/apply/done",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/sellers/apply/done" } } },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
