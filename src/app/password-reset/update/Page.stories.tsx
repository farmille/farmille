import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/password-reset/update",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/password-reset/update" } },
  },
  args: {
    searchParams: Promise.resolve({ token_hash: "storybook-valid-password-reset-token-2026" }),
  },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const InvalidLink: Story = { args: { searchParams: Promise.resolve({}) } };
