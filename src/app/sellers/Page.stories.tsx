import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../.storybook/page-session";

const meta = {
  title: "Pages/sellers",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/sellers" } } },
  args: { searchParams: Promise.resolve({}) },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
