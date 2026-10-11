import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/admin/company-applications/[id]",
  component: Page,
  beforeEach: () => preparePageSession("admin"),
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: { pathname: "/admin/company-applications/11111111-1111-4111-8111-111111111111" },
    },
  },
  args: { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
