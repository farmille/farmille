import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/admin/materials",
  component: Page,
  beforeEach: () => preparePageSession("admin"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/admin/materials" } } },
  args: { searchParams: Promise.resolve({}) },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
