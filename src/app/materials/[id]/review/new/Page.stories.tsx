import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../../.storybook/page-session";

const meta = {
  title: "Pages/materials/[id]/review/new",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: { pathname: "/materials/00000000-0000-4000-8000-000000000101/review/new" },
    },
  },
  args: { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000101" }) },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
