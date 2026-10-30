import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TokenCatalog as Page } from "./TokenCatalog";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/dev/tokens",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/dev/tokens" } } },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
