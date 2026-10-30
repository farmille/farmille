import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Page from "./page";

const meta = {
  title: "Pages/account/withdrawn",
  component: Page,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/account/withdrawn" } } },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
