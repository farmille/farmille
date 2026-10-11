import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../../.storybook/page-session";

const meta = {
  title: "Pages/dashboard/articles/[id]/edit",
  component: Page,
  beforeEach: () => preparePageSession("seller"),
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: { pathname: "/dashboard/articles/11111111-1111-4111-8111-111111111111/edit" },
    },
  },
  args: { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
